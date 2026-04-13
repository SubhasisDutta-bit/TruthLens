# 🔍 TruthLens — News Credibility Analyzer

AI-powered news credibility analysis. Paste any article URL to get:
- 🎭 **Sentiment** — Positive / Neutral / Negative tone
- ⚖️ **Political Bias** — Left ↔ Right spectrum
- 🔥 **Emotional Language** — Clickbait, CAPS, manipulation detection
- 🏆 **Credibility Score** — 7-factor heuristic (0–100)
- 🌐 **Similar Articles** — 9 related stories from different perspectives

---

## 📁 Folder Structure

```
TruthLens/
├── backend/                    ← Node.js + Express API
│   ├── .env                    ← API keys & config
│   ├── package.json
│   └── src/
│       ├── index.js            ← Server entry point (port 5001)
│       ├── middleware/
│       │   └── auth.js         ← Firebase token verification
│       ├── routes/
│       │   ├── analyze.js      ← POST /api/analyze
│       │   ├── history.js      ← GET /api/history
│       │   └── similar.js      ← GET /api/similar
│       └── services/
│           ├── nlp.js          ← 4 NLP analyzers (466 lines)
│           ├── scraper.js      ← Axios + Cheerio scraper
│           ├── firebase.js     ← Firestore cache + history
│           └── newsApi.js      ← NewsAPI similar articles
│
└── frontend/                   ← React + Tailwind + Vite
    ├── .env                    ← Firebase config
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── firebase.js
        ├── index.css           ← Full design system
        ├── main.jsx
        ├── context/
        │   └── AuthContext.jsx
        ├── pages/
        │   └── Home.jsx
        └── components/
            ├── Header.jsx
            ├── UrlInput.jsx
            ├── AnalysisDashboard.jsx
            ├── SentimentChart.jsx
            ├── BiasScale.jsx
            ├── CredibilityMeter.jsx
            ├── ScoreCard.jsx
            ├── ArticleHighlighter.jsx
            ├── SimilarArticles.jsx
            ├── AuthModal.jsx
            └── HistoryPanel.jsx
```

---

## 🚀 How to Run

### Step 1 — Install dependencies

Open **two terminal windows**:

**Terminal 1 (Backend):**
```bash
cd TruthLens/backend
npm install
```

**Terminal 2 (Frontend):**
```bash
cd TruthLens/frontend
npm install
```

### Step 2 — Start both servers

**Terminal 1 (Backend):**
```bash
cd TruthLens/backend
node src/index.js
# Runs on http://localhost:5001
```

**Terminal 2 (Frontend):**
```bash
cd TruthLens/frontend
npm run dev
# Runs on http://localhost:5173
```

### Step 3 — Open in browser

Go to: **http://localhost:5173**

Paste any news article URL and click **Analyze**!

---

## 🔑 API Keys (already configured)

| Key | File | Status |
|-----|------|--------|
| NewsAPI | `backend/.env` | ✅ Set |
| Firebase Web Config | `frontend/.env` | ✅ Set |
| Firebase Admin SDK | `backend/.env` | ⚠️ Optional (for caching) |

### To enable Firebase Firestore caching (optional):
1. Go to [Firebase Console](https://console.firebase.google.com) → Project Settings → Service Accounts
2. Click **Generate New Private Key** → Download JSON
3. Open `backend/.env` and paste the JSON as:
   ```
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...entire JSON on one line...}
   ```

---

## 🧠 NLP Stack (100% Node.js — no Python needed)

| Analyzer | Method | Output |
|---|---|---|
| Sentiment | AFINN-165 lexicon (`sentiment` npm) | positive/neutral/negative + score |
| Bias | 60+ term lexicons + 35 domain database | left/center/right + confidence % |
| Emotional | NRC-inspired lexicon + clickbait patterns | intensity 0–100 + emotion tags |
| Credibility | 7-factor heuristic scoring | 0–100 + per-factor breakdown |

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Tailwind CSS, Vite, Recharts, Lucide Icons, Firebase SDK
- **Backend:** Node.js, Express, Axios, Cheerio, `sentiment` npm package
- **Database:** Firebase Firestore (24h cache + user history)
- **Auth:** Firebase Authentication (Google + Email/Password)
- **News:** NewsAPI (similar articles)
