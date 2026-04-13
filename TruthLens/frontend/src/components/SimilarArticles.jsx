import { ExternalLink, Globe, Clock } from 'lucide-react';

const BIAS_CONFIG = {
  'left':       { label: 'Left',       color: '#1e40af', bg: '#e8edf5' },
  'lean-left':  { label: 'Lean Left',  color: '#1d3461', bg: '#e8edf5' },
  'center':     { label: 'Center',     color: '#2d6a4f', bg: '#f0f7f4' },
  'lean-right': { label: 'Lean Right', color: '#92400e', bg: '#fdf6ec' },
  'right':      { label: 'Right',      color: '#991b1b', bg: '#fdf2f2' },
};

const DOMAIN_BIAS_MAP = {
  'reuters.com':     'center',
  'apnews.com':      'center',
  'bbc.com':         'center',
  'bbc.co.uk':       'center',
  'thehill.com':     'center',
  'cnn.com':         'lean-left',
  'nytimes.com':     'lean-left',
  'theguardian.com': 'lean-left',
  'foxnews.com':     'lean-right',
  'wsj.com':         'lean-right',
  'msnbc.com':       'left',
  'huffpost.com':    'left',
  'breitbart.com':   'right',
  'dailywire.com':   'right',
};

function guessBias(domain) {
  for (const [d, bias] of Object.entries(DOMAIN_BIAS_MAP)) {
    if (domain?.includes(d)) return bias;
  }
  return null;
}

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 3600)  return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

export default function SimilarArticles({ articles }) {
  if (!articles || articles.length === 0) return null;

  return (
    <div className="animate-fade-in">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4 pt-2">
        <Globe className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
          Related Coverage
        </h2>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded ml-1"
          style={{ background: 'var(--border-light)', color: 'var(--text-secondary)' }}
        >
          {articles.length} sources
        </span>
        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
          Multiple perspectives
        </span>
      </div>

      {/* Article grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {articles.map((article, i) => {
          const bias = guessBias(article.domain);
          const biasConf = bias ? BIAS_CONFIG[bias] : null;
          const ago = timeAgo(article.publishedAt);

          return (
            <a
              key={i}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card p-4 flex flex-col gap-2.5 no-underline group transition-all duration-150"
              style={{ textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              {/* Source row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded overflow-hidden flex-shrink-0"
                    style={{ background: 'var(--border-light)' }}>
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${article.domain}&sz=32`}
                      alt=""
                      className="w-full h-full"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  <span
                    className="text-xs font-semibold uppercase tracking-wide truncate max-w-[110px]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {article.source || article.domain}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {biasConf && (
                    <span
                      className="text-xs font-medium px-1.5 py-0.5 rounded capitalize"
                      style={{ color: biasConf.color, background: biasConf.bg }}
                    >
                      {biasConf.label}
                    </span>
                  )}
                  <ExternalLink
                    className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--accent)' }}
                  />
                </div>
              </div>

              {/* Title */}
              <h4
                className="text-sm font-medium leading-snug line-clamp-3"
                style={{ color: 'var(--text-primary)' }}
              >
                {article.title}
              </h4>

              {/* Description */}
              {article.description && (
                <p className="text-xs leading-relaxed line-clamp-2"
                  style={{ color: 'var(--text-secondary)' }}>
                  {article.description}
                </p>
              )}

              {/* Timestamp */}
              {ago && (
                <div className="flex items-center gap-1 text-xs mt-auto"
                  style={{ color: 'var(--text-muted)' }}>
                  <Clock className="w-3 h-3" /> {ago}
                </div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
