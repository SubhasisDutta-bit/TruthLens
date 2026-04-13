/**
 * GET /api/similar?q=keywords
 * Returns similar articles from NewsAPI for given search keywords.
 */

const express = require('express');
const router = express.Router();
const { getSimilarArticles } = require('../services/newsApi');

router.get('/', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter `q` is required' });

  try {
    const articles = await getSimilarArticles(q);
    res.json({ articles });
  } catch (err) {
    console.error('Similar articles error:', err);
    res.status(500).json({ error: 'Failed to fetch similar articles', detail: err.message });
  }
});

module.exports = router;
