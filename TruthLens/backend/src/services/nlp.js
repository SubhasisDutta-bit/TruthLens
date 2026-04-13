/**
 * TruthLens NLP Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides four analyzers, all running in Node.js (no Python required):
 *   1. Sentiment   — AFINN-165 lexicon via `sentiment` package
 *   2. Bias        — Keyword frequency + domain lookup
 *   3. Emotional   — NRC-inspired emotional word lexicon
 *   4. Credibility — Multi-factor weighted engine (see credibility.js)
 */

const Sentiment = require('sentiment');
const sentimentAnalyzer = new Sentiment();
const { computeCredibility, getSourceReputationScore } = require('./credibility');

// ─── Bias Lexicons ────────────────────────────────────────────────────────────

const LEFT_LEAN_TERMS = [
  'social justice', 'systemic racism', 'white privilege', 'income inequality',
  'progressive', 'climate crisis', 'gun control', 'universal healthcare',
  'undocumented immigrants', 'reproductive rights', 'transgender rights',
  'marginalized communities', 'oppression', 'equity', 'diversity and inclusion',
  'defund the police', 'green new deal', 'wealth tax', 'corporate greed',
  'living wage', 'affordable housing', 'student debt relief', 'medicare for all',
  'working families', 'economic justice', 'racial equity', 'intersectionality',
  'structural racism', 'implicit bias', 'microaggressions', 'safe space',
  'latinx', 'cisgender', 'nonbinary', 'gender identity', 'climate change action',
  'police brutality', 'indigenous rights', 'reparations', 'food insecurity',
];

const RIGHT_LEAN_TERMS = [
  'border security', 'illegal immigration', 'illegal aliens', 'open borders',
  'socialist', 'socialism', 'radical left', 'deep state', 'mainstream media',
  'second amendment', 'traditional values', 'free market', 'law and order',
  'pro-life', 'religious liberty', 'big government', 'government overreach',
  'cancel culture', 'woke', 'identity politics', 'political correctness',
  'antifa', 'election fraud', 'patriot', 'america first', 'drain the swamp',
  'globalism', 'welfare state', 'entitlements', 'job creators', 'tax burden',
  'fake news', 'biased media', 'radical agenda', 'tough on crime',
  'parental rights', 'school choice', 'energy independence', 'deregulation',
];

// ─── Domain Bias Database (AllSides-inspired) ────────────────────────────────

const DOMAIN_BIAS_MAP = {
  // Hard Left
  'jacobinmag.com':     { bias: 'left',       score: -90 },
  'motherjones.com':    { bias: 'left',       score: -80 },
  'msnbc.com':          { bias: 'left',       score: -75 },
  'huffpost.com':       { bias: 'left',       score: -70 },
  'slate.com':          { bias: 'left',       score: -65 },
  'thenation.com':      { bias: 'left',       score: -75 },
  // Lean Left
  'cnn.com':            { bias: 'lean-left',  score: -40 },
  'nytimes.com':        { bias: 'lean-left',  score: -35 },
  'washingtonpost.com': { bias: 'lean-left',  score: -35 },
  'theguardian.com':    { bias: 'lean-left',  score: -40 },
  'vox.com':            { bias: 'lean-left',  score: -50 },
  'nbcnews.com':        { bias: 'lean-left',  score: -30 },
  'cbsnews.com':        { bias: 'lean-left',  score: -30 },
  'abcnews.go.com':     { bias: 'lean-left',  score: -30 },
  'npr.org':            { bias: 'lean-left',  score: -25 },
  'politico.com':       { bias: 'lean-left',  score: -20 },
  'time.com':           { bias: 'lean-left',  score: -25 },
  'theatlantic.com':    { bias: 'lean-left',  score: -35 },
  'buzzfeednews.com':   { bias: 'lean-left',  score: -40 },
  // Center
  'reuters.com':        { bias: 'center',     score:   0 },
  'apnews.com':         { bias: 'center',     score:   0 },
  'bbc.com':            { bias: 'center',     score:   5 },
  'bbc.co.uk':          { bias: 'center',     score:   5 },
  'thehill.com':        { bias: 'center',     score:   5 },
  'axios.com':          { bias: 'center',     score:   0 },
  'bloomberg.com':      { bias: 'center',     score:  10 },
  'usatoday.com':       { bias: 'center',     score:   0 },
  'csmonitor.com':      { bias: 'center',     score:   0 },
  'economist.com':      { bias: 'center',     score:  10 },
  'pbs.org':            { bias: 'center',     score:  -5 },
  // Lean Right
  'foxnews.com':        { bias: 'lean-right', score:  40 },
  'wsj.com':            { bias: 'lean-right', score:  30 },
  'nypost.com':         { bias: 'lean-right', score:  40 },
  'nationalreview.com': { bias: 'lean-right', score:  50 },
  'forbes.com':         { bias: 'lean-right', score:  20 },
  'washingtonexaminer.com': { bias: 'lean-right', score: 45 },
  'newsmax.com':        { bias: 'lean-right', score:  55 },
  'thehill.com':        { bias: 'center',     score:   5 },
  // Hard Right
  'breitbart.com':      { bias: 'right',      score:  80 },
  'dailywire.com':      { bias: 'right',      score:  75 },
  'thefederalist.com':  { bias: 'right',      score:  70 },
  'oann.com':           { bias: 'right',      score:  85 },
  'infowars.com':       { bias: 'right',      score:  95 },
};

// ─── Source Reliability — delegated to credibility.js ───────────────────────
// DOMAIN_RELIABILITY is now maintained in credibility.js (SOURCE_REPUTATION map).

// ─── Emotional Lexicon (NRC-inspired) ────────────────────────────────────────

const EMOTIONAL_LEXICON = {
  anger: [
    'outrage', 'fury', 'rage', 'furious', 'infuriating', 'incensed', 'enraged',
    'livid', 'irate', 'outraged', 'hateful', 'hostile', 'violent', 'aggressive',
    'outrageous', 'blasting', 'slammed', 'attacked', 'ripped', 'destroyed',
  ],
  fear: [
    'terrifying', 'frightening', 'shocking', 'alarming', 'horrifying', 'dreadful',
    'devastating', 'catastrophic', 'disaster', 'crisis', 'panic', 'threat',
    'danger', 'chaos', 'collapse', 'nightmare', 'imminent', 'dire',
  ],
  disgust: [
    'disgusting', 'revolting', 'appalling', 'nauseating', 'vile', 'repulsive',
    'corrupt', 'disgusted', 'sickening', 'filthy', 'shameful', 'scandalous',
    'atrocious', 'deplorable', 'abhorrent',
  ],
  surprise: [
    'bombshell', 'explosive', 'unbelievable', 'unprecedented', 'stunning',
    'astonishing', 'jaw-dropping', 'shocking', 'startling', 'extraordinary',
    'remarkable', 'incredible', 'dramatic', 'sensational',
  ],
  joy: [
    'wonderful', 'amazing', 'fantastic', 'triumphant', 'glorious', 'magnificent',
    'extraordinary', 'spectacular', 'celebrate', 'victory', 'brilliant',
  ],
};

// ─── Clickbait Patterns ──────────────────────────────────────────────────────

const CLICKBAIT_PATTERNS = [
  /you won'?t believe/i,
  /\d+\s+(things|reasons|ways|facts|secrets)/i,
  /what happened next/i,
  /nobody is talking about/i,
  /they don'?t want you to know/i,
  /the truth about/i,
  /this is why/i,
  /must see/i,
  /goes viral/i,
  /breaks the internet/i,
  /secret(ly)?/i,
  /exposed/i,
  /will shock you/i,
  /mind.?blowing/i,
  /you need to see this/i,
];

// ═════════════════════════════════════════════════════════════════════════════
// ANALYZER 1: SENTIMENT
// ═════════════════════════════════════════════════════════════════════════════

function analyzeSentiment(text) {
  // Use first 5000 chars for performance
  const result = sentimentAnalyzer.analyze(text.slice(0, 5000));

  // comparative ranges ~-5 to +5 → normalize to 0–100
  const raw = result.comparative;
  const normalized = Math.round(((raw + 5) / 10) * 100);
  const score = Math.max(0, Math.min(100, normalized));

  let label;
  if (score > 58) label = 'positive';
  else if (score < 42) label = 'negative';
  else label = 'neutral';

  return {
    label,
    score,
    breakdown: {
      positive: score > 58 ? score : score > 42 ? Math.round(score * 0.6) : Math.round(score * 0.3),
      neutral:  score > 58 ? Math.round((100 - score) * 0.5) : score > 42 ? 40 : Math.round(score * 0.4),
      negative: score < 42 ? 100 - score : score > 42 ? Math.round((100 - score) * 0.5) : Math.round((100 - score) * 0.7),
    },
    positiveWords: result.positive.slice(0, 10),
    negativeWords: result.negative.slice(0, 10),
    rawScore: result.score,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// ANALYZER 2: BIAS
// ═════════════════════════════════════════════════════════════════════════════

function analyzeBias(text, domain) {
  const textLower = text.toLowerCase();

  let leftCount = 0, rightCount = 0;
  const leftFound = [], rightFound = [];

  LEFT_LEAN_TERMS.forEach(term => {
    // Use word boundary matching for multi-word terms
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    const matches = textLower.match(regex);
    if (matches) {
      leftCount += matches.length;
      if (!leftFound.includes(term)) leftFound.push(term);
    }
  });

  RIGHT_LEAN_TERMS.forEach(term => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    const matches = textLower.match(regex);
    if (matches) {
      rightCount += matches.length;
      if (!rightFound.includes(term)) rightFound.push(term);
    }
  });

  // Domain bias lookup
  let domainBiasInfo = null;
  let domainScore = 0;
  if (domain) {
    for (const [d, info] of Object.entries(DOMAIN_BIAS_MAP)) {
      if (domain.includes(d)) {
        domainBiasInfo = info;
        domainScore = info.score;
        break;
      }
    }
  }

  // Text-based bias score (–100 = hard left, +100 = hard right)
  const total = leftCount + rightCount;
  let textBiasScore = 0;
  if (total > 0) {
    textBiasScore = ((rightCount - leftCount) / total) * 100;
  }

  // Weighted blend: domain 60%, text 40% (domain is more reliable)
  let biasScore;
  if (domainBiasInfo) {
    biasScore = domainScore * 0.6 + textBiasScore * 0.4;
  } else {
    biasScore = textBiasScore;
  }

  // Confidence based on evidence quality
  const textEvidence = Math.min(40, total * 4);
  const domainEvidence = domainBiasInfo ? 55 : 0;
  const confidence = Math.min(95, 15 + textEvidence + domainEvidence);

  let label;
  if      (biasScore < -55) label = 'left';
  else if (biasScore < -15) label = 'lean-left';
  else if (biasScore >  55) label = 'right';
  else if (biasScore >  15) label = 'lean-right';
  else                      label = 'center';

  return {
    label,
    score: Math.round(biasScore),    // –100 to +100
    confidence: Math.round(confidence),
    leftTermsFound: leftFound.slice(0, 8),
    rightTermsFound: rightFound.slice(0, 8),
    domainBias: domainBiasInfo?.bias || 'unknown',
    sourceReliability: getSourceReliability(domain),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// ANALYZER 3: EMOTIONAL LANGUAGE
// ═════════════════════════════════════════════════════════════════════════════

function analyzeEmotionalLanguage(text, title) {
  const combined = `${title} ${text}`.toLowerCase();
  const words = combined.split(/\s+/);
  const wordCount = words.length;

  const found = {};
  let totalEmotional = 0;

  Object.entries(EMOTIONAL_LEXICON).forEach(([emotion, wordList]) => {
    const hits = [];
    wordList.forEach(word => {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      const matches = combined.match(regex);
      if (matches) {
        hits.push(...new Set(matches.map(m => m.toLowerCase())));
        totalEmotional += matches.length;
      }
    });
    if (hits.length) found[emotion] = hits;
  });

  // Emotional density per 100 words
  const density = wordCount > 0 ? (totalEmotional / wordCount) * 100 : 0;
  const emotionScore = Math.min(100, Math.round(density * 20));

  // Clickbait detection on title
  const clickbaitHits = CLICKBAIT_PATTERNS.filter(p => p.test(title));
  const clickbaitScore = Math.min(100, clickbaitHits.length * 30);

  // ALL CAPS words ratio
  const capsWords = words.filter(w => w.length > 3 && w === w.toUpperCase() && /[A-Z]/.test(w));
  const capsRatio = wordCount > 0 ? Math.round((capsWords.length / wordCount) * 100) : 0;

  // Exclamation marks
  const exclamationCount = (text.match(/!/g) || []).length;
  const exclamationPenalty = Math.min(20, exclamationCount * 3);

  // Combined emotional score
  const combinedScore = Math.min(100, Math.round(
    emotionScore * 0.5 + clickbaitScore * 0.3 + exclamationPenalty * 0.2,
  ));

  return {
    score: combinedScore,
    emotionalWords: found,
    clickbaitScore,
    clickbaitPatterns: clickbaitHits.map(p => p.source),
    capsRatio,
    exclamationCount,
    emotionalWordCount: totalEmotional,
    dominantEmotion: Object.keys(found).sort(
      (a, b) => (found[b]?.length || 0) - (found[a]?.length || 0),
    )[0] || null,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// ANALYZER 4: CREDIBILITY  (delegates to credibility.js weighted engine)
// ═════════════════════════════════════════════════════════════════════════════

function analyzeCredibility(text, title, domain, sentimentData, emotionalData) {
  // Full multi-factor weighted scoring — see backend/src/services/credibility.js
  return computeCredibility(text, title, domain, emotionalData);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSourceReliability(domain) {
  // Delegate to the credibility engine's source reputation lookup
  return getSourceReputationScore(domain);
}

/**
 * Returns word-level annotation for article text highlighting.
 * Each token gets a type: 'left-bias' | 'right-bias' | 'emotional' | 'normal'
 */
function annotateWords(text, biasData, emotionalData) {
  const allEmotional = Object.values(emotionalData.emotionalWords).flat();
  const leftSet = new Set(biasData.leftTermsFound.map(t => t.toLowerCase()));
  const rightSet = new Set(biasData.rightTermsFound.map(t => t.toLowerCase()));
  const emotionalSet = new Set(allEmotional.map(t => t.toLowerCase()));

  // Split keeping punctuation attached to tokens
  return text.slice(0, 3000).split(/(\s+)/).map(token => {
    const clean = token.toLowerCase().replace(/[^a-z'-]/g, '');
    let type = 'normal';
    if (leftSet.has(clean))     type = 'left-bias';
    else if (rightSet.has(clean)) type = 'right-bias';
    else if (emotionalSet.has(clean)) type = 'emotional';
    return { word: token, type };
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═════════════════════════════════════════════════════════════════════════════

async function analyzeText(text, title, domain) {
  if (!text || text.length < 50) {
    throw new Error('Article text too short for analysis (minimum 50 characters)');
  }

  const sentiment  = analyzeSentiment(text);
  const bias       = analyzeBias(text, domain);
  const emotional  = analyzeEmotionalLanguage(text, title);
  const credibility = analyzeCredibility(text, title, domain, sentiment, emotional);
  const annotatedText = annotateWords(text, bias, emotional);

  return {
    sentiment,
    bias,
    emotional,
    credibility,
    annotatedText,
    meta: {
      wordCount: text.split(/\s+/).length,
      analyzedAt: new Date().toISOString(),
    },
  };
}

module.exports = { analyzeText };
