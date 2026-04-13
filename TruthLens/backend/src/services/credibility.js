/**
 * TruthLens Credibility Engine v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Multi-factor weighted credibility scoring:
 *
 *   1. Source Reputation   — curated domain database (weight: 40%)
 *   2. Content Quality     — writing complexity + readability (weight: 20%)
 *   3. Attribution Bonus   — named sources cited in text (weight: 15%)
 *   4. Emotional Penalty   — sensational word density (weight: 15%)
 *   5. Clickbait Penalty   — headline patterns + CAPS + !!! (weight: 10%)
 *
 * Final score is clamped to 0–100 and labelled:
 *   80–100 → "Highly Reliable"
 *   60–79  → "Likely Reliable"
 *   40–59  → "Questionable"
 *   0–39   → "Low Credibility"
 */

// ─── 1. Source Reputation Database ───────────────────────────────────────────
const SOURCE_REPUTATION = {
  // Tier 1 — World-class wire services / public broadcasters
  'reuters.com':        98,
  'apnews.com':         96,
  'bbc.com':            95,
  'bbc.co.uk':          95,
  'npr.org':            90,
  'pbs.org':            88,
  'csmonitor.com':      86,
  // Tier 2 — Major quality newspapers
  'nytimes.com':        92,
  'washingtonpost.com': 88,
  'theguardian.com':    90,
  'economist.com':      91,
  'theatlantic.com':    85,
  'bloomberg.com':      88,
  'wsj.com':            87,
  'ft.com':             90,
  'foreignpolicy.com':  85,
  // Tier 3 — Reliable but with notable bias
  'axios.com':          83,
  'politico.com':       80,
  'thehill.com':        79,
  'time.com':           80,
  'usatoday.com':       76,
  'cnn.com':            74,
  'nbcnews.com':        74,
  'cbsnews.com':        74,
  'abcnews.go.com':     74,
  'msnbc.com':          68,
  // Tier 4 — Mixed reputation / tabloid crossover
  'foxnews.com':        62,
  'vox.com':            65,
  'slate.com':          64,
  'huffpost.com':       63,
  'motherjones.com':    64,
  'nationalreview.com': 62,
  'thefederalist.com':  55,
  'nypost.com':         55,
  'buzzfeednews.com':   60,
  // Tier 5 — Low-credibility / tabloid
  'newsmax.com':        48,
  'dailywire.com':      44,
  'breitbart.com':      38,
  'oann.com':           32,
  'infowars.com':       10,
  'beforeitsnews.com':  12,
  'worldnewsdailyreport.com': 8,
  'naturalnews.com':    10,
  'yournewswire.com':   8,
  'dailymail.co.uk':    55,
  'thesun.co.uk':       45,
  'express.co.uk':      42,
  'mirror.co.uk':       50,
};

const SOURCE_DEFAULT = 50; // unknown domains

// ─── 2. Attribution Phrases ───────────────────────────────────────────────────
const ATTRIBUTION_PHRASES = [
  /according to/ig,
  /reported by/ig,
  /said\s+\w+/ig,
  /stated by/ig,
  /confirmed by/ig,
  /sources say/ig,
  /officials say/ig,
  /researchers (say|found|report)/ig,
  /study (found|shows|suggests)/ig,
  /data (shows|suggests|indicates)/ig,
  /\bquoted\b/ig,
  /expert[s]?\b.*(say|warn|note)/ig,
];

// ─── 3. Clickbait Patterns ────────────────────────────────────────────────────
const CLICKBAIT_PATTERNS = [
  /you won'?t believe/i,
  /\d+\s+(things|reasons|ways|facts|secrets|tricks)/i,
  /what happened next/i,
  /nobody is talking about/i,
  /they don'?t want you to know/i,
  /the truth about/i,
  /must[\s-]see/i,
  /goes viral/i,
  /breaks the internet/i,
  /will shock you/i,
  /mind[\s-]?blowing/i,
  /you need to see this/i,
  /one weird trick/i,
  /doctors hate/i,
  /jaw[\s-]?dropping/i,
  /changing everything/i,
];

const EXAGGERATED_PHRASES = [
  'shocking', 'unbelievable', 'incredible', 'amazing', "you won't believe",
  'explosive', 'bombshell', 'stunning', 'outrageous', 'insane', 'epic',
  'unprecedented', 'historic', 'breaking', 'urgent', 'must read',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normaliseDomain(domain) {
  if (!domain) return '';
  return domain.toLowerCase().replace(/^www\./, '');
}

function getSourceReputationScore(domain) {
  const d = normaliseDomain(domain);
  if (!d) return SOURCE_DEFAULT;
  for (const [key, score] of Object.entries(SOURCE_REPUTATION)) {
    if (d === key || d.endsWith(`.${key}`)) return score;
  }
  return SOURCE_DEFAULT;
}

// ─── Factor 1: Source Reputation (0–100) ─────────────────────────────────────
function scoreSourceReputation(domain) {
  const d = normaliseDomain(domain);
  const raw = getSourceReputationScore(domain);
  const isKnown = Object.keys(SOURCE_REPUTATION).some(k => d === k || d.endsWith(`.${k}`));
  return { score: raw, isKnown, domain: d };
}

// ─── Factor 2: Content Quality (–10 to +10) ──────────────────────────────────
function scoreContentQuality(text) {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
  const totalWords = text.split(/\s+/).filter(Boolean).length;
  const sentCount = sentences.length || 1;
  const avgSentLen = totalWords / sentCount;

  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const uniqueWords = new Set(words);
  const vocabRichness = words.length > 0 ? uniqueWords.size / words.length : 0;

  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 40);
  const hasStructure = paragraphs.length >= 3;

  let points = 0;
  if (avgSentLen >= 20 && avgSentLen <= 32) points += 4;
  else if (avgSentLen >= 15) points += 2;
  else if (avgSentLen > 35) points += 1;

  if (vocabRichness > 0.65) points += 4;
  else if (vocabRichness > 0.50) points += 2;
  else if (vocabRichness > 0.40) points += 1;

  if (totalWords > 600) points += 2;
  else if (totalWords > 300) points += 1;

  if (hasStructure) points += 2;

  // max points = 12, neutral (6) → 0 delta
  const normalized = Math.max(-10, Math.min(10, points - 6));

  return {
    score: normalized,
    avgSentenceLength: Math.round(avgSentLen),
    vocabRichness: Math.round(vocabRichness * 100),
    wordCount: totalWords,
    paragraphCount: paragraphs.length,
  };
}

// ─── Factor 3: Source Attribution (0–10) ─────────────────────────────────────
function scoreAttribution(text) {
  let hits = 0;
  for (const pattern of ATTRIBUTION_PHRASES) {
    const matches = text.match(pattern) || [];
    hits += matches.length;
  }
  // Reward quoted text (>15 chars inside curly/straight quotes)
  const quoteMatches = (text.match(/[\u201c\u201d][^\u201c\u201d]{15,}[\u201c\u201d]/g) || []).length
                     + (text.match(/"[^"]{15,}"/g) || []).length;
  hits += quoteMatches;

  const score = Math.min(10, Math.round(hits * 1.8));
  return { score, matches: hits };
}

// ─── Factor 4: Emotional Penalty (0–100 → used as-is) ────────────────────────
function scoreEmotionalPenalty(emotionalData) {
  const penalty = emotionalData?.score ?? 0;
  return { penalty };
}

// ─── Factor 5: Clickbait Penalty (→ displayScore 0–100) ──────────────────────
function scoreClickbait(title, text) {
  const titleLower = (title || '').toLowerCase();
  const firstParagraph = (text || '').slice(0, 500).toLowerCase();
  const combined = `${titleLower} ${firstParagraph}`;

  const patternHits = CLICKBAIT_PATTERNS.filter(p => p.test(title)).length;
  const exagHits = EXAGGERATED_PHRASES.filter(p => combined.includes(p)).length;

  const titleWords = (title || '').split(/\s+/);
  const capsWords = titleWords.filter(w => w.length > 3 && w === w.toUpperCase() && /[A-Z]/.test(w));
  const hasCapsAbuse = capsWords.length >= 2;
  const hasExcessivePunct = /[!?]{2,}/.test(title);

  let penalty = 0;
  if (patternHits >= 2 || (patternHits >= 1 && hasCapsAbuse)) penalty = 15;
  else if (patternHits >= 1 || exagHits >= 2) penalty = 8;
  else if (exagHits >= 1 || hasCapsAbuse) penalty = 4;

  if (hasExcessivePunct) penalty = Math.min(15, penalty + 4);

  const displayScore = Math.round((penalty / 15) * 100);

  return {
    penalty,
    displayScore,
    patternHits,
    exaggeratedHits: exagHits,
    hasCapsAbuse,
    hasExcessivePunct,
  };
}

// ─── Verdict Labels ───────────────────────────────────────────────────────────
function buildLabel(score) {
  if (score >= 80) return { label: 'Highly Reliable', color: '#15803d', bg: '#f0fdf4', icon: '✓' };
  if (score >= 60) return { label: 'Likely Reliable', color: '#2563eb', bg: '#eff6ff', icon: '◉' };
  if (score >= 40) return { label: 'Questionable',    color: '#b45309', bg: '#fffbeb', icon: '⚠' };
  return              { label: 'Low Credibility',     color: '#b91c1c', bg: '#fef2f2', icon: '✗' };
}

// ─── Auto-generated Explanation ──────────────────────────────────────────────
function buildExplanation(sourceRep, contentQ, attribution, emotionalPenalty, clickbait) {
  const sourcePart = sourceRep.isKnown
    ? (sourceRep.score >= 85
        ? 'a high-reputation, editorially rigorous source'
        : sourceRep.score >= 65
          ? 'a moderately reputable source'
          : 'a source with a below-average reputation for accuracy')
    : 'an unknown or unverified domain (scored at default 50)';

  const contentPart = contentQ.score >= 4
    ? 'well-structured, vocabulary-rich writing'
    : contentQ.score >= 0
      ? 'average writing complexity'
      : 'simple or low-complexity content';

  const emotionPart = emotionalPenalty.penalty <= 8
    ? 'a low emotional tone'
    : emotionalPenalty.penalty <= 30
      ? 'a moderately emotional tone'
      : 'heavy sensational or emotional framing';

  const attributionPart = attribution.matches >= 4
    ? 'multiple attributed citations'
    : attribution.matches >= 2
      ? 'some source attribution'
      : 'little or no source attribution';

  const clickbaitPart = clickbait.patternHits === 0 && !clickbait.hasCapsAbuse
    ? 'a neutral, non-clickbait headline'
    : clickbait.penalty >= 12
      ? 'a strongly clickbait-style headline'
      : 'mild clickbait signals in the headline';

  return `This article is from ${sourcePart}, with ${contentPart}, ${emotionPart}, ${attributionPart}, and ${clickbaitPart}.`;
}

// ─── Main Export ──────────────────────────────────────────────────────────────
/**
 * Compute a multi-factor credibility score.
 *
 * @param {string} text         - Full article body text
 * @param {string} title        - Article headline
 * @param {string} domain       - Article domain (e.g. 'bbc.com')
 * @param {object} emotionalData - Result of analyzeEmotionalLanguage() from nlp.js
 * @returns {object} Credibility result with score, label, breakdown, explanation
 */
function computeCredibility(text, title, domain, emotionalData) {
  const sourceRep   = scoreSourceReputation(domain);
  const contentQ    = scoreContentQuality(text);
  const attribution = scoreAttribution(text);
  const emotional   = scoreEmotionalPenalty(emotionalData);
  const clickbait   = scoreClickbait(title, text);

  // Normalise factors to 0–100 for weighted formula
  const source100      = sourceRep.score;
  const content100     = Math.round((contentQ.score + 10) * 5); // –10..+10 → 0..100
  const attribution100 = attribution.score * 10;                 // 0..10 → 0..100
  const emotional100   = emotional.penalty;                      // already 0–100
  const clickbait100   = clickbait.displayScore;                 // 0–100

  const raw =
    (0.40 * source100)      +
    (0.20 * content100)     +
    (0.15 * attribution100) -
    (0.15 * emotional100)   -
    (0.10 * clickbait100);

  const score = Math.max(0, Math.min(100, Math.round(raw)));
  const verdict = buildLabel(score);
  const explanation = buildExplanation(sourceRep, contentQ, attribution, emotional, clickbait);

  return {
    score,
    label:       verdict.label,
    color:       verdict.color,
    bg:          verdict.bg,
    icon:        verdict.icon,
    explanation,
    breakdown: {
      source: {
        label:        'Source Reputation',
        displayValue: sourceRep.score,
        contribution: +(0.40 * source100).toFixed(1),
        weight:       40,
        note:         sourceRep.isKnown ? `${sourceRep.domain} — scored ${sourceRep.score}/100` : 'Unknown domain — default 50/100',
        isPenalty:    false,
      },
      content: {
        label:        'Content Quality',
        displayValue: content100,
        contribution: +(0.20 * content100).toFixed(1),
        weight:       20,
        note:         `Avg ${contentQ.avgSentenceLength} words/sentence · ${contentQ.vocabRichness}% vocab richness`,
        isPenalty:    false,
      },
      attribution: {
        label:        'Source Attribution',
        displayValue: attribution100,
        contribution: +(0.15 * attribution100).toFixed(1),
        weight:       15,
        note:         `${attribution.matches} attribution signal${attribution.matches !== 1 ? 's' : ''} found`,
        isPenalty:    false,
      },
      emotion: {
        label:        'Emotional Language',
        displayValue: emotional100,
        contribution: -(0.15 * emotional100).toFixed(1),
        weight:       15,
        note:         emotional.penalty > 30
                        ? 'High emotional intensity — credibility reduced'
                        : emotional.penalty > 8
                          ? 'Moderate emotional tone'
                          : 'Low emotional intensity',
        isPenalty:    true,
      },
      clickbait: {
        label:        'Clickbait Signals',
        displayValue: clickbait100,
        contribution: -(0.10 * clickbait100).toFixed(1),
        weight:       10,
        note:         clickbait.patternHits > 0
                        ? `${clickbait.patternHits} clickbait pattern${clickbait.patternHits > 1 ? 's' : ''} in headline`
                        : 'No clickbait patterns detected',
        isPenalty:    true,
      },
    },
    // Legacy fields for backwards-compat with any existing consumers
    factors: {
      sourceReputation: { label: 'Source Reputation', value: sourceRep.score,   contribution: Math.round(0.40 * source100 - 20) },
      contentQuality:   { label: 'Content Quality',   value: contentQ.score,    contribution: Math.round(0.20 * content100 - 10) },
      attribution:      { label: 'Source Attribution',value: attribution.score,  contribution: Math.round(0.15 * attribution100 - 7) },
      emotionalTone:    { label: 'Emotional Language', value: emotional.penalty,  contribution: -Math.round(0.15 * emotional100) },
      clickbait:        { label: 'Clickbait Signals',  value: clickbait.displayScore, contribution: -Math.round(0.10 * clickbait100) },
    },
  };
}

module.exports = { computeCredibility, getSourceReputationScore };
