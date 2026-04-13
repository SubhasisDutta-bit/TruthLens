/**
 * GET /api/history
 * Returns the analysis history for an authenticated user.
 */

const express = require('express');
const router = express.Router();
const { getUserHistory } = require('../services/firebase');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const history = await getUserHistory(req.userId);
    res.json({ history });
  } catch (err) {
    console.error('History fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve history', detail: err.message });
  }
});

module.exports = router;
