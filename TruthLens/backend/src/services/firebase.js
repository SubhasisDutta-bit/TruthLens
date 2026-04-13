/**
 * TruthLens Firebase Service
 * Uses Firebase Admin SDK for Firestore (server-side).
 * Gracefully degrades if no service account is configured.
 *
 * To enable: Set FIREBASE_SERVICE_ACCOUNT env var to the service account JSON string.
 * Download from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key
 */

let db = null;
let adminInitialized = false;

function initFirebase() {
  if (adminInitialized) return;
  adminInitialized = true;

  try {
    const admin = require('firebase-admin');

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Parse the service account from env var
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Use application default credentials (for GCP / Cloud Run)
      admin.initializeApp();
    } else {
      console.warn('⚠️  Firebase: No service account configured. Running without Firestore caching.');
      console.warn('   Set FIREBASE_SERVICE_ACCOUNT env var to enable caching & history.');
      return;
    }

    db = admin.firestore();
    console.log('✅ Firebase Admin SDK initialized');
  } catch (err) {
    console.error('Firebase init error:', err.message);
  }
}

// ─── Cache Operations ─────────────────────────────────────────────────────────

/**
 * Retrieve cached analysis by URL hash
 */
async function getCache(cacheKey) {
  initFirebase();
  if (!db) return null;
  try {
    const doc = await db.collection('cache').doc(cacheKey).get();
    if (!doc.exists) return null;

    const data = doc.data();
    // Cache expires after 24 hours
    const cachedAt = data.cachedAt?.toDate?.() || new Date(data.analyzedAt);
    const ageHours = (Date.now() - cachedAt.getTime()) / (1000 * 60 * 60);
    if (ageHours > 24) return null; // Stale cache

    return data;
  } catch (err) {
    console.error('Cache read error:', err.message);
    return null;
  }
}

/**
 * Store analysis result in cache and optionally save to user history
 */
async function setCache(cacheKey, data, userId) {
  initFirebase();
  if (!db) return;
  try {
    const admin = require('firebase-admin');
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    // Write to cache collection
    await db.collection('cache').doc(cacheKey).set({
      ...data,
      cachedAt: timestamp,
    });

    // Write to user history if authenticated
    if (userId) {
      await db.collection('history').add({
        ...data,
        userId,
        savedAt: timestamp,
      });
    }
  } catch (err) {
    console.error('Cache write error:', err.message);
  }
}

/**
 * Get analysis history for a specific user (most recent 20)
 */
async function getUserHistory(userId) {
  initFirebase();
  if (!db) return [];
  try {
    const snapshot = await db
      .collection('history')
      .where('userId', '==', userId)
      .orderBy('savedAt', 'desc')
      .limit(20)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      savedAt: doc.data().savedAt?.toDate?.()?.toISOString() || null,
    }));
  } catch (err) {
    console.error('History read error:', err.message);
    return [];
  }
}

module.exports = { getCache, setCache, getUserHistory };
