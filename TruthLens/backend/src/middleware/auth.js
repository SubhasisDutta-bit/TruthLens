/**
 * Firebase Auth token verification middleware.
 * Verifies the Firebase ID token passed in the Authorization header.
 * Falls back gracefully if Firebase Admin SDK is not configured.
 */

const axios = require('axios');

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  // Try Firebase Admin SDK first
  try {
    const admin = require('firebase-admin');
    const decoded = await admin.auth().verifyIdToken(token);
    req.userId = decoded.uid;
    req.userEmail = decoded.email;
    return next();
  } catch {
    // Admin not initialized — fall back to Firebase REST API verification
  }

  // Fallback: verify via Firebase REST API
  try {
    const apiKey = process.env.FIREBASE_WEB_API_KEY;
    if (!apiKey) {
      // No way to verify — allow with warning for development
      console.warn('⚠️  Auth: Cannot verify token (no Firebase Admin or API key). Using unverified claim.');
      req.userId = 'anonymous';
      return next();
    }

    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      { idToken: token },
      { timeout: 5000 },
    );

    const users = response.data?.users;
    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.userId = users[0].localId;
    req.userEmail = users[0].email;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token verification failed', detail: err.message });
  }
}

module.exports = { verifyToken };
