import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Shield, ShieldX, Info } from 'lucide-react';

// ── Ease function ─────────────────────────────────────────────────────────────
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// ── Map score → visual palette ────────────────────────────────────────────────
function getVerdict(score) {
  if (score >= 80) return {
    label: 'Highly Reliable',
    stroke: '#2d6a4f', text: '#2d6a4f', bg: '#f0f7f4',
    trackBg: '#d4eddf',
    Icon: ShieldCheck,
  };
  if (score >= 60) return {
    label: 'Likely Reliable',
    stroke: '#1d3461', text: '#1d3461', bg: '#e8edf5',
    trackBg: '#c8d3e8',
    Icon: Shield,
  };
  if (score >= 40) return {
    label: 'Questionable',
    stroke: '#92400e', text: '#92400e', bg: '#fdf6ec',
    trackBg: '#f5d9ae',
    Icon: ShieldAlert,
  };
  return {
    label: 'Low Credibility',
    stroke: '#991b1b', text: '#991b1b', bg: '#fdf2f2',
    trackBg: '#f5c6c6',
    Icon: ShieldX,
  };
}

// ── Factor bar row ────────────────────────────────────────────────────────────
function FactorBar({ factor }) {
  const { label, displayValue, contribution, weight, note, isPenalty } = factor;
  const barColor = isPenalty ? '#991b1b' : '#1d3461';
  const barBg    = isPenalty ? '#fdf2f2' : '#e8edf5';
  const contribColor = isPenalty ? '#991b1b' : '#2d6a4f';
  const contribText  = isPenalty
    ? `−${Math.abs(contribution).toFixed(1)}`
    : `+${Math.abs(contribution).toFixed(1)}`;

  return (
    <div className="cred-factor-row">
      <div className="cred-factor-header">
        <span className="cred-factor-label">
          {label}
          <span className="cred-factor-weight">({weight}%)</span>
        </span>
        <span className="cred-factor-contrib" style={{ color: contribColor }}>
          {contribText}
        </span>
      </div>

      {/* Progress bar */}
      <div className="cred-factor-track" style={{ background: '#f3f4f6' }}>
        <div
          className="cred-factor-fill"
          style={{
            width: `${Math.max(2, Math.min(100, displayValue))}%`,
            background: barColor,
            opacity: isPenalty ? 0.75 : 1,
          }}
        />
      </div>

      {note && (
        <p className="cred-factor-note">{note}</p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CredibilityMeter({ credibility }) {
  const [displayed, setDisplayed] = useState(0);
  const [showFactors, setShowFactors] = useState(false);

  useEffect(() => {
    if (!credibility) return;
    const target = credibility.score;
    const duration = 950;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayed(Math.round(easeOutCubic(progress) * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setShowFactors(false);
    const t = setTimeout(() => setShowFactors(true), 400);
    return () => clearTimeout(t);
  }, [credibility?.score]);

  if (!credibility) return null;

  const { score, label, explanation, breakdown } = credibility;
  const verdict = getVerdict(score);
  const { Icon } = verdict;

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (displayed / 100) * circumference;

  // Order of factors as displayed
  const factorOrder = ['source', 'content', 'attribution', 'emotion', 'clickbait'];
  const factors = breakdown
    ? factorOrder.map(k => ({ key: k, ...breakdown[k] })).filter(Boolean)
    : [];

  return (
    <div className="card p-5 animate-fade-in" id="credibility-meter">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4" style={{ color: verdict.stroke }} />
        <h3 className="font-semibold text-sm" style={{ color: '#1a1a1a' }}>
          Credibility Score
        </h3>
      </div>

      {/* Gauge + Verdict */}
      <div className="flex flex-col sm:flex-row items-center gap-5 mb-4">
        {/* Animated SVG gauge */}
        <div className="relative flex-shrink-0">
          <svg width="130" height="130" className="rotate-[-90deg]">
            <circle
              cx="65" cy="65" r={radius}
              fill="none"
              stroke={verdict.trackBg}
              strokeWidth="10"
            />
            <circle
              cx="65" cy="65" r={radius}
              fill="none"
              stroke={verdict.stroke}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
              strokeDashoffset="0"
              style={{ transition: 'stroke 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold leading-none" style={{ color: verdict.text }}>
              {displayed}
            </span>
            <span className="text-[10px] font-semibold mt-0.5 uppercase tracking-wider" style={{ color: verdict.text }}>
              /100
            </span>
          </div>
        </div>

        {/* Verdict text */}
        <div className="flex-1 min-w-0">
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-2"
            style={{ background: verdict.bg, color: verdict.text }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label ?? verdict.label}
          </div>
          {explanation && (
            <p className="text-[13px] leading-relaxed" style={{ color: '#6b6b6b' }}>
              {explanation}
            </p>
          )}
        </div>
      </div>

      {/* Factor breakdown */}
      {showFactors && factors.length > 0 && (
        <div className="cred-factors-section">
          <div className="flex items-center gap-1.5 mb-3">
            <Info className="w-3.5 h-3.5" style={{ color: '#9a9a9a' }} />
            <p className="section-label">Scoring Breakdown</p>
          </div>
          <div className="space-y-3">
            {factors.map(f => (
              <FactorBar key={f.key} factor={f} />
            ))}
          </div>
        </div>
      )}

      {/* Verdict banner */}
      <div
        className="mt-4 px-3 py-2.5 rounded-lg text-xs text-center font-medium"
        style={{ background: verdict.bg, color: verdict.text }}
      >
        {score >= 80 && '✓ Strong credibility indicators — this source meets high editorial standards'}
        {score >= 60 && score < 80 && '◉ Generally reliable — cross-reference key claims independently'}
        {score >= 40 && score < 60 && '⚠ Questionable credibility — verify claims with primary sources'}
        {score < 40 && '✗ Significant red flags — treat all claims with strong skepticism'}
      </div>
    </div>
  );
}
