import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { MessageSquare } from 'lucide-react';

const SENTIMENT_COLORS = {
  positive: '#2d6a4f',
  neutral:  '#57534e',
  negative: '#991b1b',
};

const SENTIMENT_ICONS = {
  positive: '↑',
  neutral:  '→',
  negative: '↓',
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-1.5 text-xs" style={{ boxShadow: 'var(--shadow-panel)' }}>
      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{payload[0].name}</p>
      <p style={{ color: payload[0].payload.fill }}>{payload[0].value}%</p>
    </div>
  );
}

export default function SentimentChart({ sentiment }) {
  if (!sentiment) return null;

  const { label, score, breakdown, positiveWords, negativeWords } = sentiment;

  const chartData = [
    { name: 'Positive', value: breakdown.positive, fill: SENTIMENT_COLORS.positive },
    { name: 'Neutral',  value: breakdown.neutral,  fill: SENTIMENT_COLORS.neutral  },
    { name: 'Negative', value: breakdown.negative, fill: SENTIMENT_COLORS.negative },
  ].filter(d => d.value > 0);

  const mainColor = SENTIMENT_COLORS[label] || 'var(--text-secondary)';

  return (
    <div className="card p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
          Sentiment Analysis
        </h3>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* Donut chart */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={56}
                strokeWidth={2}
                stroke="#ffffff"
                dataKey="value"
                animationBegin={0}
                animationDuration={700}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold leading-none" style={{ color: mainColor }}>
              {SENTIMENT_ICONS[label] || '—'}
            </span>
            <span className="text-xs font-bold mt-0.5" style={{ color: mainColor }}>{score}%</span>
          </div>
        </div>

        {/* Legend + bars */}
        <div className="flex-1 w-full">
          <p className="font-bold text-2xl capitalize mb-0.5" style={{ color: mainColor }}>
            {label}
          </p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Overall article tone</p>

          <div className="space-y-2">
            {chartData.map(d => (
              <div key={d.name} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }} />
                <span className="text-xs w-14" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-light)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${d.value}%`, backgroundColor: d.fill }}
                  />
                </div>
                <span className="text-xs font-medium w-8 text-right" style={{ color: 'var(--text-primary)' }}>
                  {d.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Word samples */}
      {(positiveWords?.length > 0 || negativeWords?.length > 0) && (
        <div
          className="mt-4 pt-4 grid grid-cols-2 gap-3"
          style={{ borderTop: '1px solid var(--border-light)' }}
        >
          {positiveWords?.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: '#2d6a4f' }}>Positive words</p>
              <div className="flex flex-wrap gap-1">
                {positiveWords.slice(0, 5).map(w => (
                  <span key={w} className="text-xs px-2 py-0.5 rounded"
                    style={{ background: '#f0f7f4', color: '#2d6a4f' }}>
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}
          {negativeWords?.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: '#991b1b' }}>Negative words</p>
              <div className="flex flex-wrap gap-1">
                {negativeWords.slice(0, 5).map(w => (
                  <span key={w} className="text-xs px-2 py-0.5 rounded"
                    style={{ background: '#fdf2f2', color: '#991b1b' }}>
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
