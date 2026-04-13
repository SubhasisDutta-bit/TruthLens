import { Flame, AlertTriangle } from 'lucide-react';

const EMOTION_CONFIG = {
  anger:    { color: '#991b1b', bg: '#fdf2f2', label: 'Anger',    emoji: '😡' },
  fear:     { color: '#92400e', bg: '#fdf6ec', label: 'Fear',     emoji: '😨' },
  disgust:  { color: '#5b21b6', bg: '#f5f3ff', label: 'Disgust',  emoji: '🤢' },
  surprise: { color: '#1d3461', bg: '#e8edf5', label: 'Surprise', emoji: '😲' },
  joy:      { color: '#2d6a4f', bg: '#f0f7f4', label: 'Joy',      emoji: '😊' },
};

export default function ScoreCard({ emotional }) {
  if (!emotional) return null;

  const { score, emotionalWords, clickbaitScore, capsRatio, exclamationCount } = emotional;

  // Score colour — desaturated professional tones
  const scoreColor = score > 70 ? '#991b1b' : score > 40 ? '#92400e' : '#2d6a4f';
  const scoreLabel = score > 70 ? 'High Intensity' : score > 40 ? 'Moderate' : 'Low';
  const scoreBg    = score > 70 ? '#fdf2f2'  : score > 40 ? '#fdf6ec' : '#f0f7f4';

  const emotions = Object.entries(emotionalWords || {})
    .map(([emotion, words]) => ({ emotion, words, ...(EMOTION_CONFIG[emotion] || {}) }))
    .filter(e => e.words?.length > 0);

  return (
    <div className="card p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-4 h-4 text-muted-icon" />
        <h3 className="font-semibold text-sm text-primary">
          Emotional Language
        </h3>
      </div>

      {/* Intensity score bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-secondary">Intensity Score</span>
            <span className="text-xl font-bold" style={{ color: scoreColor }}>
              {score}
              <span className="text-xs font-normal ml-0.5 text-muted">/100</span>
            </span>
          </div>
          <div className="score-bar-track">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${score}%`, background: scoreColor }}
            />
          </div>
        </div>
        <p className="text-xs mt-1.5 font-semibold" style={{ color: scoreColor }}>{scoreLabel}</p>

      {/* Sub-score tiles */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {[
          { value: clickbaitScore,   label: 'Clickbait', color: '#92400e', bg: '#fdf6ec' },
          { value: `${capsRatio}%`,  label: 'ALL CAPS',  color: '#7c3aed', bg: '#f5f3ff' },
          { value: exclamationCount, label: 'Exclamat.', color: '#991b1b', bg: '#fdf2f2' },
        ].map(tile => (
          <div key={tile.label} className="score-tile" style={{ background: tile.bg }}>
            <div className="score-tile-value" style={{ color: tile.color }}>{tile.value}</div>
            <div className="score-tile-label">{tile.label}</div>
          </div>
        ))}
      </div>

      {/* Detected emotions */}
      {emotions.length > 0 ? (
        <div>
          <p className="section-label mb-3">Emotions Detected</p>
          <div className="space-y-2.5">
            {emotions.map(({ emotion, words, color, bg, label, emoji }) => (
              <div key={emotion} className="flex items-start gap-2.5">
                <span className="text-base flex-shrink-0">{emoji}</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold mb-1.5" style={{ color }}>{label}</p>
                  <div className="flex flex-wrap gap-1">
                    {words.slice(0, 4).map(w => (
                      <span
                        key={w}
                        className="emotion-pill"
                        style={{ color, background: bg }}
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-status">
          <AlertTriangle className="w-4 h-4" />
          No strong emotional language detected
        </div>
      )}
    </div>
  );
}
