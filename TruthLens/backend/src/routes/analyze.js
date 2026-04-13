/**
 * POST /api/analyze
 * Main analysis endpoint.
 * Accepts a URL, runs multi-layer scraping, NLP analysis, caches results.
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const { scrapeArticle } = require('../services/scraper');
const { analyzeText }   = require('../services/nlp');
const { getCache, setCache } = require('../services/firebase');
const { getSimilarArticles, extractKeywords } = require('../services/newsApi');

router.post('/', async (req, res) => {
  const { url, userId } = req.body;

  // ── Input validation ─────────────────────────────────────────────────────
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'A valid URL is required.' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch {
    return res.status(400).json({ error: 'Please provide a valid HTTP/HTTPS URL.' });
  }

  const cacheKey = crypto.createHash('md5').update(url.trim()).digest('hex');

  // ── Cache check ──────────────────────────────────────────────────────────
  try {
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`[Cache] Hit for ${url}`);
      return res.json({ ...cached, fromCache: true });
    }
  } catch (err) {
    console.warn('[Cache] Lookup failed:', err.message);
  }

  // ── Multi-layer scrape ───────────────────────────────────────────────────
  let article;
  try {
    console.log(`[Analyze] Scraping: ${url}`);
    article = await scrapeArticle(url);
  } catch (err) {
    // Structured scraping failure (all 3 layers exhausted)
    if (err.isScrapingFailure) {
      return res.status(422).json({
        error: 'Content extraction failed',
        userMessage: err.userMessage,
        suggestions: err.suggestions,
      });
    }
    // Unexpected error
    return res.status(422).json({
      error: 'Could not scrape article',
      userMessage: err.message,
      suggestions: [],
    });
  }

  // ── NLP Analysis ─────────────────────────────────────────────────────────
  let analysis;
  try {
    analysis = await analyzeText(article.bodyText, article.title, article.domain);
  } catch (err) {
    return res.status(500).json({
      error: 'NLP analysis failed',
      userMessage: 'The article was retrieved but analysis failed. Please try again.',
      suggestions: [],
    });
  }

  // ── Similar Articles (non-blocking) ──────────────────────────────────────
  let similar = [];
  try {
    const keywords = extractKeywords(article.title);
    similar = await getSimilarArticles(keywords, article.domain);
  } catch (err) {
    console.warn('[Similar] Fetch failed:', err.message);
  }

  // ── Assemble result ───────────────────────────────────────────────────────
  const result = {
    url,
    article: {
      title:           article.title,
      description:     article.description,
      author:          article.author,
      publishDate:     article.publishDate,
      image:           article.image,
      domain:          article.domain,
      wordCount:       analysis.meta.wordCount,
      extractionMethod: article.extractionMethod,
    },
    analysis: {
      sentiment:    analysis.sentiment,
      bias:         analysis.bias,
      emotional:    analysis.emotional,
      credibility:  analysis.credibility,
      annotatedText: analysis.annotatedText,
    },
    similar,
    analyzedAt: new Date().toISOString(),
    fromCache: false,
  };

  // ── Cache + history (non-blocking) ───────────────────────────────────────
  setCache(cacheKey, result, userId).catch(err =>
    console.warn('[Cache] Write failed:', err.message),
  );

  res.json(result);
});

module.exports = router;
