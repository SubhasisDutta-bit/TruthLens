import { Shield, Minus } from 'lucide-react';

const BIAS_CONFIG = {
  left:         { label: 'Left',       color: '#1e40af', bg: '#e8edf5', trackColor: '#6b8ccc' },
  'lean-left':  { label: 'Lean Left',  color: '#1d3461', bg: '#e8edf5', trackColor: '#93b0d8' },
  center:       { label: 'Center',     color: '#2d6a4f', bg: '#f0f7f4', trackColor: '#6aab87' },
  'lean-right': { label: 'Lean Right', color: '#92400e', bg: '#fdf6ec', trackColor: '#d4956a' },
  right:        { label: 'Right',      color: '#991b1b', bg: '#fdf2f2', trackColor: '#c97b7b' },
  unknown:      { label: 'Unknown',    color: 'var(--text-secondary)', bg: 'var(--border-light)', trackColor: '#c4bfb8' },
};

const SEGMENTS = [
  { label: 'Left',       color: '#6b8ccc', pct: 20 },
  { label: 'Lean Left',  color: '#93b0d8', pct: 20 },
  { label: 'Center',     color: '#6aab87', pct: 20 },
  { label: 'Lean Right', color: '#d4956a', pct: 20 },
  { label: 'Right',      color: '#c97b7b', pct: 20 },
];

export default function BiasScale({ bias }) {
  if (!bias) return null;

  const { score, label, confidence, leftTermsFound, rightTermsFound, domainBias } = bias;
  const config = BIAS_CONFIG[label] || BIAS_CONFIG.unknown;

  // Convert score (–100 to +100) → percent (0–100)
  const pct = Math.round(((score + 100) / 200) * 100);
  const thumbPct = Math.max(3, Math.min(97, pct));

  return (
    <div className="card p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Political Bias
          </h3>
        </div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Confidence:{' '}
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {confidence}%
          </span>
        </div>
      </div>

      {/* Bias label */}
      <div className="flex items-center justify-center mb-5">
        <span
          className="text-3xl font-bold px-4 py-1.5 rounded-lg"
          style={{ color: config.color, background: config.bg }}
        >
          {config.label}
        </span>
      </div>

      {/* Spectrum bar */}
      <div className="relative mb-5">
        <div className="relative h-2.5 rounded-full overflow-hidden flex">
          {SEGMENTS.map(seg => (
            <div
              key={seg.label}
              style={{ width: `${seg.pct}%`, backgroundColor: seg.color, opacity: 0.3 }}
            />
          ))}
        </div>

        {/* Active highlight */}
        <div
          className="absolute top-0 h-2.5 rounded-full transition-all duration-500"
          style={{
            left: `${Math.max(0, thumbPct - 10)}%`,
            width: '20%',
            backgroundColor: config.trackColor,
            opacity: 0.65,
          }}
        />

        {/* Thumb */}
        <div
          className="absolute -top-1 w-4.5 h-4.5 rounded-full border-2 border-white transition-all duration-500 flex items-center justify-center"
          style={{
            left: `calc(${thumbPct}% - 9px)`,
            width: '18px',
            height: '18px',
            backgroundColor: config.color,
            boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
        </div>

        {/* Labels */}
        <div className="flex justify-between mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span style={{ color: '#1e40af' }}>← Left</span>
          <span>Center</span>
          <span style={{ color: '#991b1b' }}>Right →</span>
        </div>
      </div>

      {/* Domain bias */}
      {domainBias && domainBias !== 'unknown' && (
        <div
          className="text-xs mb-3 px-3 py-2 rounded-md"
          style={{ background: 'var(--bg-page)', border: '1px solid var(--border-light)' }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Source domain lean: </span>
          <span
            className="font-semibold"
            style={{ color: BIAS_CONFIG[domainBias]?.color || 'var(--text-secondary)' }}
          >
            {BIAS_CONFIG[domainBias]?.label || domainBias}
          </span>
        </div>
      )}

      {/* Detected terms */}
      <div className="grid grid-cols-2 gap-3">
        {leftTermsFound?.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-1.5" style={{ color: '#1e40af' }}>Left-leaning terms</p>
            <div className="flex flex-wrap gap-1">
              {leftTermsFound.slice(0, 4).map(t => (
                <span key={t} className="text-xs px-2 py-0.5 rounded"
                  style={{ background: '#e8edf5', color: '#1d3461' }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
        {rightTermsFound?.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-1.5" style={{ color: '#991b1b' }}>Right-leaning terms</p>
            <div className="flex flex-wrap gap-1">
              {rightTermsFound.slice(0, 4).map(t => (
                <span key={t} className="text-xs px-2 py-0.5 rounded"
                  style={{ background: '#fdf2f2', color: '#991b1b' }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
        {!leftTermsFound?.length && !rightTermsFound?.length && (
          <div className="col-span-2 text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
            <Minus className="w-3 h-3 inline mr-1" />
            No strong bias terms detected
          </div>
        )}
      </div>
    </div>
  );
}
