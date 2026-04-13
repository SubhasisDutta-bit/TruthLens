import { useEffect, useState } from 'react';
import { X, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function getCredColor(score) {
  if (score >= 80) return { color: '#2d6a4f', bg: '#f0f7f4' };
  if (score >= 60) return { color: '#1d3461', bg: '#e8edf5' };
  if (score >= 40) return { color: '#92400e', bg: '#fdf6ec' };
  return            { color: '#991b1b', bg: '#fdf2f2' };
}

export default function HistoryPanel({ onClose }) {
  const { user, getToken } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => { fetchHistory(); }, []);

  async function fetchHistory() {
    if (!user) { setLoading(false); return; }
    try {
      const token = await getToken();
      const res = await fetch('/api/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHistory(data.history || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="w-full max-w-md mx-4 max-h-[82vh] flex flex-col rounded-xl animate-fade-in"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-panel)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-light)' }}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
              Analysis History
            </h2>
          </div>
          <button
            id="close-history-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--border-light)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">

          {loading && (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--accent)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading history…</p>
            </div>
          )}

          {error && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid #f5c6c6' }}
            >
              {error}
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <div className="text-center py-14">
              <Clock className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--border)' }} />
              <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No history yet</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Analyzed articles will appear here
              </p>
            </div>
          )}

          {history.map((item, i) => {
            const cred = item.analysis?.credibility?.score;
            const bias = item.analysis?.bias?.label;
            const credStyle = cred !== undefined ? getCredColor(cred) : null;

            return (
              <div
                key={item.id || i}
                className="p-3.5 rounded-lg transition-colors"
                style={{ border: '1px solid var(--border-light)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-page)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate mb-0.5" style={{ color: 'var(--text-primary)' }}>
                      {item.article?.title || 'Untitled'}
                    </p>
                    <p className="text-xs truncate mb-2" style={{ color: 'var(--text-muted)' }}>
                      {item.url}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {cred !== undefined && credStyle && (
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded"
                          style={{ color: credStyle.color, background: credStyle.bg }}
                        >
                          {cred}/100
                        </span>
                      )}
                      {bias && (
                        <span className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>
                          {bias}
                        </span>
                      )}
                      {item.analyzedAt && (
                        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
                          {new Date(item.analyzedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-1.5 rounded transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onClick={e => e.stopPropagation()}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.color = 'var(--accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
