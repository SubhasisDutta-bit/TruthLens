import { useState } from 'react';
import { Highlighter, Info } from 'lucide-react';

const TYPE_STYLES = {
  'left-bias':  { bg: 'rgba(30, 64, 175, 0.09)',  border: '#1e40af', label: 'Left-leaning term' },
  'right-bias': { bg: 'rgba(153, 27, 27, 0.09)',  border: '#991b1b', label: 'Right-leaning term' },
  'emotional':  { bg: 'rgba(146, 64, 14, 0.09)',  border: '#92400e', label: 'Emotional language' },
  'normal':     { bg: 'transparent', border: 'transparent', label: '' },
};

const LEGEND = [
  { type: 'left-bias',  label: 'Left-leaning',  color: '#1e40af', bg: '#e8edf5' },
  { type: 'right-bias', label: 'Right-leaning',  color: '#991b1b', bg: '#fdf2f2' },
  { type: 'emotional',  label: 'Emotional',      color: '#92400e', bg: '#fdf6ec' },
];

export default function ArticleHighlighter({ annotatedText }) {
  const [tooltip, setTooltip] = useState(null);
  const [showAll, setShowAll] = useState(false);

  if (!annotatedText || annotatedText.length === 0) return null;

  const tokens = showAll ? annotatedText : annotatedText.slice(0, 160);
  const hasMore = annotatedText.length > 160;

  return (
    <div className="card p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Highlighter className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Text Analysis — Bias &amp; Emotion
          </h3>
        </div>
        {/* Legend (desktop) */}
        <div className="hidden sm:flex items-center gap-4">
          {LEGEND.map(l => (
            <div key={l.type} className="flex items-center gap-1.5">
              <span
                className="text-xs font-medium px-1.5 py-0.5 rounded"
                style={{ color: l.color, background: l.bg }}
              >
                {l.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend (mobile) */}
      <div className="flex sm:hidden flex-wrap gap-2 mb-3">
        {LEGEND.map(l => (
          <span key={l.type} className="text-xs font-medium px-1.5 py-0.5 rounded"
            style={{ color: l.color, background: l.bg }}>
            {l.label}
          </span>
        ))}
      </div>

      {/* Highlighted text block */}
      <div
        className="text-sm leading-7 rounded-lg p-4"
        style={{
          background: 'var(--bg-page)',
          border: '1px solid var(--border-light)',
          fontFamily: '"Inter", system-ui, sans-serif',
          color: 'var(--text-secondary)',
        }}
      >
        {tokens.map((token, i) => {
          const style = TYPE_STYLES[token.type];
          const isWhitespace = /^\s+$/.test(token.word);

          if (isWhitespace || token.type === 'normal') {
            return <span key={i}>{token.word}</span>;
          }

          return (
            <span
              key={i}
              className="relative cursor-help rounded-sm"
              style={{
                background: style.bg,
                borderBottom: `2px solid ${style.border}`,
                paddingInline: '2px',
              }}
              onMouseEnter={() => setTooltip({ index: i, label: style.label, color: style.border })}
              onMouseLeave={() => setTooltip(null)}
            >
              {token.word}
              {tooltip?.index === i && (
                <span
                  className="absolute -top-8 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap px-2 py-1 rounded text-xs font-medium text-white"
                  style={{ background: tooltip.color, boxShadow: 'var(--shadow-panel)' }}
                >
                  {tooltip.label}
                </span>
              )}
            </span>
          );
        })}

        {!showAll && hasMore && (
          <span style={{ color: 'var(--text-muted)' }}> …</span>
        )}
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-2.5 text-xs flex items-center gap-1 transition-colors"
          style={{ color: 'var(--accent)' }}
        >
          <Info className="w-3 h-3" />
          {showAll ? 'Show less' : `Show full text (${annotatedText.length} tokens)`}
        </button>
      )}
    </div>
  );
}
