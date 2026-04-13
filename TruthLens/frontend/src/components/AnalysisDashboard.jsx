import { Calendar, User, Globe, BookOpen, RefreshCw, AlertTriangle, ExternalLink, Layers } from 'lucide-react';
import SentimentChart from './SentimentChart';
import BiasScale from './BiasScale';
import CredibilityMeter from './CredibilityMeter';
import ScoreCard from './ScoreCard';
import ArticleHighlighter from './ArticleHighlighter';
import SimilarArticles from './SimilarArticles';

// ── Extraction method label ─────────────────────────────────────────────────
const METHOD_LABELS = {
  'cheerio':         { text: 'Full article extracted',    color: '#2d6a4f', bg: '#f0f7f4' },
  'readability':     { text: 'Extracted via Readability', color: '#92400e', bg: '#fdf6ec' },
  'newsapi-summary': { text: 'Summary via NewsAPI',       color: '#1d3461', bg: '#e8edf5' },
};

function ExtractionBadge({ method }) {
  if (!method || !METHOD_LABELS[method]) return null;
  const { text, color, bg } = METHOD_LABELS[method];
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded"
      style={{ color, background: bg }}>
      <Layers className="w-3 h-3" />
      {text}
    </span>
  );
}

// ── Article header card ─────────────────────────────────────────────────────
function ArticleHeader({ article, onReset }) {
  const { title, description, author, publishDate, domain, image, extractionMethod } = article;

  const formattedDate = (() => {
    if (!publishDate) return null;
    try {
      return new Date(publishDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return null; }
  })();

  return (
    <div className="card p-5 mb-1 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">

          {/* Domain + extraction method row */}
          <div className="flex items-center flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-1.5">
              <img
                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                alt=""
                className="w-4 h-4"
                onError={e => { e.target.style.display = 'none'; }}
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                {domain}
              </span>
            </div>
            <ExtractionBadge method={extractionMethod} />
          </div>

          {/* Title */}
          <h2 className="headline text-xl sm:text-2xl mb-2.5 leading-snug">
            {title}
          </h2>

          {description && (
            <p className="text-sm leading-relaxed mb-4 line-clamp-2 panel-note">
              {description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
            {author && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" /> {author}
              </span>
            )}
            {formattedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {formattedDate}
              </span>
            )}
            {article.wordCount && (
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> {article.wordCount.toLocaleString()} words
              </span>
            )}
          </div>
        </div>

        {/* Thumbnail */}
        {image && (
          <img
            src={image}
            alt={title}
            className="article-thumbnail"
            onError={e => { e.target.style.display = 'none'; }}
          />
        )}
      </div>

      {/* Footer row */}
      <div className="article-footer">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="panel-link flex items-center gap-1 truncate max-w-[280px]"
        >
          <Globe className="w-3 h-3 flex-shrink-0" />
          {article.url}
          <ExternalLink className="w-3 h-3 flex-shrink-0 ml-0.5" />
        </a>
        <button
          onClick={onReset}
          className="btn-ghost text-xs flex-shrink-0"
          id="analyze-another-btn"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Analyze Another
        </button>
      </div>
    </div>
  );
}

// ── Loading skeleton ────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div className="space-y-3 animate-fade-in">
      <div className="card p-5 space-y-3">
        <div className="h-3 w-24 shimmer rounded" />
        <div className="h-6 w-2/3 shimmer rounded" />
        <div className="h-3 w-full shimmer rounded" />
        <div className="h-3 w-4/5 shimmer rounded" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="card p-5 space-y-3">
            <div className="h-3 w-20 shimmer rounded" />
            <div className="h-10 w-1/2 shimmer rounded" />
            <div className="h-2 w-full shimmer rounded" />
          </div>
        ))}
      </div>
      <p className="text-center text-sm py-3 text-muted">
        Fetching & analyzing article — this usually takes 3–8 seconds…
      </p>
    </div>
  );
}

// ── Error state (smart) ─────────────────────────────────────────────────────
function ErrorState({ error, errorMeta, onReset }) {
  const message = errorMeta?.userMessage || error || 'An unexpected error occurred.';
  const suggestions = errorMeta?.suggestions || [];

  return (
    <div className="error-panel">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: '#fef2f2' }}>
          <AlertTriangle className="w-4.5 h-4.5" style={{ color: '#b91c1c', width: '1.1rem', height: '1.1rem' }} />
        </div>
        <div>
          <h3 className="status-heading">
            Analysis failed
          </h3>
          <p className="status-subtitle">
            {message}
          </p>
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid #f3f4f6' }}>
          <p className="section-label mb-3">Try a source with open access</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map(s => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-xs py-1.5 text-accent"
              >
                <ExternalLink className="w-3 h-3" />
                {s.name}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        <button id="try-again-btn" onClick={onReset} className="btn-primary text-sm py-2">
          <RefreshCw className="w-4 h-4" /> Try Another URL
        </button>
      </div>
    </div>
  );
}

// ── Main dashboard ──────────────────────────────────────────────────────────
export default function AnalysisDashboard({ result, loading, error, errorMeta, onReset }) {
  if (loading) return <LoadingState />;
  if (error || errorMeta) return <ErrorState error={error} errorMeta={errorMeta} onReset={onReset} />;
  if (!result) return null;

  const { article, analysis, similar, fromCache } = result;

  return (
    <div className="space-y-3">
      {/* Cache notice */}
      {fromCache && (
        <div className="cache-note animate-fade-in">
          <RefreshCw className="w-3 h-3" />
          Loaded from cache
        </div>
      )}

      {/* Article header */}
      <ArticleHeader article={{ ...article, url: result.url }} onReset={onReset} />

      {/* Score grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <SentimentChart sentiment={analysis.sentiment} />
        <BiasScale bias={analysis.bias} />
        <CredibilityMeter credibility={analysis.credibility} />
        <ScoreCard emotional={analysis.emotional} />
      </div>

      {/* Highlighted article text */}
      {analysis.annotatedText && (
        <ArticleHighlighter annotatedText={analysis.annotatedText} />
      )}

      {/* Similar articles */}
      {similar?.length > 0 && (
        <SimilarArticles articles={similar} />
      )}
    </div>
  );
}
