import { useState } from 'react';
import { Search, AlertCircle, Loader2, Link2 } from 'lucide-react';

const EXAMPLE_URLS = [
  'https://www.bbc.com/news/world',
  'https://apnews.com',
  'https://www.reuters.com',
];

// Domains that commonly restrict scraping — warn early
const RESTRICTED_PATTERNS = [
  'twitter.com', 'x.com', 'facebook.com', 'instagram.com',
  'tiktok.com', 'linkedin.com', 'reddit.com',
  'nytimes.com', 'wsj.com', 'ft.com', 'bloomberg.com', 'economist.com',
];

function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function getWarningForUrl(str) {
  try {
    const hostname = new URL(str).hostname.replace('www.', '');
    if (RESTRICTED_PATTERNS.some(p => hostname.includes(p))) {
      return 'This site may restrict access. We\'ll try all extraction methods, but results aren\'t guaranteed.';
    }
  } catch { /* ignore */ }
  return null;
}

export default function UrlInput({ onAnalyze, loading }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  const handleChange = (val) => {
    setUrl(val);
    setError('');
    if (val.trim()) {
      setWarning(getWarningForUrl(val.trim()) || '');
    } else {
      setWarning('');
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    setError('');
    const trimmed = url.trim();
    if (!trimmed) { setError('Please enter a news article URL'); return; }
    if (!isValidUrl(trimmed)) { setError('Please enter a valid URL (must start with http:// or https://)'); return; }
    onAnalyze(trimmed);
  };

  const handleExample = (exUrl) => {
    handleChange(exUrl);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="card p-5 animate-fade-in">

        {/* Label row */}
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="w-4 h-4 text-muted-icon" />
          <span className="section-label">Article URL</span>
        </div>

        <form onSubmit={handleSubmit} id="analyze-form">
          <div className="flex gap-2.5">
            <div className="relative flex-1">
              <input
                id="url-input"
                type="url"
                value={url}
                onChange={e => handleChange(e.target.value)}
                placeholder="Paste a news article URL to analyze…"
                className="input-field pr-9"
                disabled={loading}
                autoComplete="off"
              />
              {url && (
                <button
                  type="button"
                  onClick={() => handleChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-icon hover:text-primary transition-colors"
                  aria-label="Clear URL"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              id="analyze-btn"
              type="submit"
              disabled={loading || !url.trim()}
              className="btn-primary px-5 flex-shrink-0 min-w-[110px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Analyze
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-2.5 form-error">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Warning (early detection) */}
          {!error && warning && (
            <div className="mt-2.5 form-warning">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {warning}
            </div>
          )}
        </form>

        {/* Example URLs */}
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          <span className="text-xs panel-note">Try:</span>
          {EXAMPLE_URLS.map(exUrl => (
            <button
              key={exUrl}
              onClick={() => handleExample(exUrl)}
              disabled={loading}
              className="example-chip"
            >
              {new URL(exUrl).hostname.replace('www.', '')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
