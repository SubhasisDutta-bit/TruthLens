/**
 * TruthLens NewsAPI Service
 * Fetches similar articles from diverse sources for perspective comparison.
 */

const axios = require('axios');

const NEWS_API_BASE = 'https://newsapi.org/v2';
const API_KEY = process.env.NEWS_API_KEY;

// Diverse source groups to show multiple perspectives
const PERSPECTIVE_SOURCES = {
  'left':       'huffingtonpost,msnbc,salon,the-huffington-post',
  'lean-left':  'cnn,msnbc,the-guardian-uk,new-york-times,bbc-news',
  'center':     'reuters,associated-press,bbc-news,the-hill',
  'lean-right': 'fox-news,the-wall-street-journal,national-review',
  'right':      'breitbart-news,the-american-conservative',
};

/**
 * Extract meaningful keywords from a title for search
 */
function extractKeywords(title) {
  if (!title) return '';
  const STOP_WORDS = new Set([
    'the','a','an','is','in','on','at','to','for','of','and','or','but',
    'with','this','that','are','was','has','have','been','will','be',
    'as','from','by','its','it','we','our','they','their', 'about',
  ]);

  return title
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => !STOP_WORDS.has(w.toLowerCase()) && w.length > 3)
    .slice(0, 5)
    .join(' ');
}

/**
 * Fetch similar articles from NewsAPI
 * Returns articles grouped by perspective
 */
async function getSimilarArticles(keywords, currentDomain) {
  if (!API_KEY) {
    console.warn('NEWS_API_KEY not set — skipping similar articles');
    return [];
  }
  if (!keywords || keywords.trim().length < 3) return [];

  try {
    const response = await axios.get(`${NEWS_API_BASE}/everything`, {
      params: {
        q: keywords,
        language: 'en',
        sortBy: 'relevancy',
        pageSize: 15,
        apiKey: API_KEY,
      },
      timeout: 10000,
    });

    const articles = (response.data.articles || [])
      // Filter out the current article's domain
      .filter(a => {
        if (!a.url || !a.title || a.title === '[Removed]') return false;
        if (currentDomain && a.url.includes(currentDomain)) return false;
        return true;
      })
      .map(a => {
        const domain = (() => {
          try { return new URL(a.url).hostname.replace(/^www\./, ''); } catch { return ''; }
        })();

        return {
          title: a.title,
          url: a.url,
          source: a.source?.name || domain,
          domain,
          description: a.description || '',
          publishedAt: a.publishedAt,
          image: a.urlToImage || null,
        };
      })
      .slice(0, 9); // Max 9 similar articles

    return articles;
  } catch (err) {
    if (err.response?.status === 426) {
      console.warn('NewsAPI: Developer plan only supports 24h-old articles for /everything endpoint');
    } else {
      console.error('NewsAPI error:', err.message);
    }
    return [];
  }
}

module.exports = { getSimilarArticles, extractKeywords };
