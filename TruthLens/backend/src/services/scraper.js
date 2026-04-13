/**
 * TruthLens Article Scraper — Multi-Layer Extraction Pipeline
 *
 * Layer 1: Axios + Cheerio (direct scrape with rotated UA)
 * Layer 2: @mozilla/readability + jsdom (Firefox Reader Mode algorithm)
 * Layer 3: NewsAPI description/content fallback
 * Layer 4: Graceful structured error with source suggestions
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

// ── Extraction method identifiers ───────────────────────────────────────────
const EXTRACTION_METHODS = {
  CHEERIO:        'cheerio',
  READABILITY:    'readability',
  NEWSAPI:        'newsapi-summary',
  FAILED:         'failed',
};

// ── Rotated User-Agent pool ─────────────────────────────────────────────────
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
];

function getHeaders() {
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  return {
    'User-Agent': ua,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0',
  };
}

// ── Selectors to find main article content ──────────────────────────────────
const CONTENT_SELECTORS = [
  'article',
  '[role="main"]',
  '.post-content',
  '.article-content',
  '.article-body',
  '.story-body',
  '.story-content',
  '.entry-content',
  '.post-body',
  '.article__body',
  '.article-text',
  '.content-body',
  '.article__content',
  '.js-article-body',
  '#article-body',
  '#story-body',
  'main',
  '.content',
];

// ── Elements to strip before extracting text ────────────────────────────────
const NOISE_SELECTORS = [
  'script', 'style', 'nav', 'header', 'footer',
  'iframe', 'aside', '.ad', '.advertisement',
  '.social-share', '.share-buttons', '.related',
  '.newsletter', '.subscription', '.comments',
  '.recommended', '.trending', '.sidebar',
  '.paywall', '.subscription-prompt', '.piano-offer',
  'noscript', 'figure > figcaption',
];

// ── Fetch raw HTML ──────────────────────────────────────────────────────────
async function fetchHtml(url) {
  const response = await axios.get(url, {
    headers: getHeaders(),
    timeout: 20000,
    maxRedirects: 5,
    responseType: 'text',
  });
  return response.data;
}

// ── Extract shared metadata fields from Cheerio ─────────────────────────────
function extractMeta($, url) {
  const title =
    $('meta[property="og:title"]').attr('content')?.trim() ||
    $('meta[name="twitter:title"]').attr('content')?.trim() ||
    $('h1').first().text().trim() ||
    $('title').text().trim() ||
    'Untitled Article';

  const description =
    $('meta[property="og:description"]').attr('content')?.trim() ||
    $('meta[name="description"]').attr('content')?.trim() ||
    $('meta[name="twitter:description"]').attr('content')?.trim() ||
    '';

  const author =
    $('meta[name="author"]').attr('content')?.trim() ||
    $('meta[property="article:author"]').attr('content')?.trim() ||
    $('[rel="author"]').first().text().trim() ||
    $('.author-name').first().text().trim() ||
    $('.byline').first().text().trim() ||
    $('[class*="author"]').first().text().trim() ||
    '';

  const publishDate =
    $('meta[property="article:published_time"]').attr('content') ||
    $('meta[name="pubdate"]').attr('content') ||
    $('time[datetime]').first().attr('datetime') ||
    $('time').first().text().trim() ||
    '';

  const image =
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    '';

  let domain = '';
  try { domain = new URL(url).hostname.replace(/^www\./, ''); } catch { /* ignore */ }

  return { title, description, author, publishDate, image, domain };
}

// ── LAYER 1: Axios + Cheerio ────────────────────────────────────────────────
async function extractWithCheerio(url) {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  NOISE_SELECTORS.forEach(sel => $(sel).remove());

  const meta = extractMeta($, url);

  let bodyText = '';
  for (const selector of CONTENT_SELECTORS) {
    const el = $(selector).first();
    if (el.length) {
      const candidate = el.text().trim();
      if (candidate.length > 200) {
        bodyText = candidate;
        break;
      }
    }
  }

  if (bodyText.length < 200) {
    bodyText = $('p')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(t => t.length > 40)
      .join(' ');
  }

  if (bodyText.length < 100) {
    bodyText = $('body').text().trim();
  }

  bodyText = bodyText.replace(/\s+/g, ' ').replace(/\t/g, ' ').trim().slice(0, 12000);

  if (bodyText.length < 150) {
    // Signal to try next layer — throw with raw html so Layer 2 can use it
    const err = new Error('Cheerio: insufficient text extracted');
    err.html = html;
    err.meta = meta;
    throw err;
  }

  return { ...meta, bodyText, url, extractionMethod: EXTRACTION_METHODS.CHEERIO };
}

// ── LAYER 2: @mozilla/readability + jsdom ───────────────────────────────────
async function extractWithReadability(url, cachedHtml = null, cachedMeta = null) {
  const html = cachedHtml || await fetchHtml(url);

  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document, {
    charThreshold: 100,
    keepClasses: false,
  });

  const article = reader.parse();

  if (!article || !article.textContent || article.textContent.trim().length < 100) {
    throw new Error('Readability: could not extract meaningful content');
  }

  const bodyText = article.textContent
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12000);

  // Merge with cached meta, preferring Readability's parsed values
  const meta = cachedMeta || {};
  return {
    title:         article.title || meta.title || 'Untitled Article',
    description:   article.excerpt || meta.description || '',
    author:        article.byline || meta.author || '',
    publishDate:   meta.publishDate || '',
    image:         meta.image || '',
    domain:        meta.domain || new URL(url).hostname.replace(/^www\./, ''),
    bodyText,
    url,
    extractionMethod: EXTRACTION_METHODS.READABILITY,
  };
}

// ── LAYER 3: NewsAPI summary fallback ───────────────────────────────────────
async function extractWithNewsApi(url) {
  const API_KEY = process.env.NEWS_API_KEY;
  if (!API_KEY) throw new Error('NewsAPI key not configured');

  let domain = '';
  try { domain = new URL(url).hostname.replace(/^www\./, ''); } catch { /* ignore */ }

  const response = await axios.get('https://newsapi.org/v2/everything', {
    params: {
      q: domain,
      language: 'en',
      sortBy: 'relevancy',
      pageSize: 5,
      apiKey: API_KEY,
    },
    timeout: 10000,
  });

  const articles = (response.data.articles || [])
    .filter(a => a.url && a.url.includes(domain) && a.title && a.title !== '[Removed]');

  if (articles.length === 0) throw new Error('NewsAPI: no matching articles found for domain');

  const a = articles[0];
  const bodyText = [a.title, a.description, a.content].filter(Boolean).join(' ').replace(/\[.*?\]/g, '').trim();

  if (bodyText.length < 50) throw new Error('NewsAPI: article content too short');

  return {
    title:       a.title,
    description: a.description || '',
    author:      a.author || '',
    publishDate: a.publishedAt || '',
    image:       a.urlToImage || '',
    domain,
    bodyText,
    url,
    extractionMethod: EXTRACTION_METHODS.NEWSAPI,
  };
}

// ── SUGGESTED SOURCES (shown on graceful failure) ────────────────────────────
const SUGGESTED_SOURCES = [
  { name: 'BBC News', url: 'https://www.bbc.com/news' },
  { name: 'AP News', url: 'https://apnews.com' },
  { name: 'Reuters', url: 'https://www.reuters.com' },
  { name: 'The Guardian', url: 'https://www.theguardian.com' },
];

// ── Main export: scrapeArticle ───────────────────────────────────────────────
async function scrapeArticle(url) {
  let cheerioHtml = null;
  let cheerioMeta = null;

  // ── Layer 1: Cheerio ───────────────────────────────────────────────────────
  try {
    console.log(`[Scraper] Layer 1 (Cheerio): ${url}`);
    return await extractWithCheerio(url);
  } catch (err) {
    console.warn(`[Scraper] Layer 1 failed: ${err.message}`);
    // Preserve cached html/meta for Layer 2 reuse
    if (err.html) cheerioHtml = err.html;
    if (err.meta) cheerioMeta = err.meta;

    // If it's an HTTP error (403, 429, etc.), skip directly to Layer 3
    const status = err.response?.status;
    if (status === 403 || status === 401 || status === 429 || status === 451) {
      console.warn(`[Scraper] HTTP ${status} — skipping to Layer 3`);
    } else {
      // ── Layer 2: Readability ─────────────────────────────────────────────
      try {
        console.log(`[Scraper] Layer 2 (Readability): ${url}`);
        return await extractWithReadability(url, cheerioHtml, cheerioMeta);
      } catch (err2) {
        console.warn(`[Scraper] Layer 2 failed: ${err2.message}`);
      }
    }
  }

  // ── Layer 3: NewsAPI ───────────────────────────────────────────────────────
  try {
    console.log(`[Scraper] Layer 3 (NewsAPI fallback): ${url}`);
    return await extractWithNewsApi(url);
  } catch (err3) {
    console.warn(`[Scraper] Layer 3 failed: ${err3.message}`);
  }

  // ── Layer 4: Graceful failure ──────────────────────────────────────────────
  console.error(`[Scraper] All layers failed for: ${url}`);
  const scrapingError = new Error('SCRAPING_FAILED');
  scrapingError.isScrapingFailure = true;
  scrapingError.userMessage =
    'This site restricts automated access. It may be paywalled, JavaScript-rendered, or have bot protection enabled.';
  scrapingError.suggestions = SUGGESTED_SOURCES;
  throw scrapingError;
}

module.exports = { scrapeArticle, EXTRACTION_METHODS };
