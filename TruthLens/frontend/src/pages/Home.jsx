import { useState } from 'react';
import { Search, Shield, TrendingUp, Eye, Database } from 'lucide-react';
import UrlInput from '../components/UrlInput';
import AnalysisDashboard from '../components/AnalysisDashboard';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: Shield,
    title: 'Bias Detection',
    desc: 'Multi-layer political lean analysis using keyword lexicons and domain reputation data.',
  },
  {
    icon: TrendingUp,
    title: 'Sentiment Analysis',
    desc: 'AFINN-165 lexicon scoring — breaks down positive, negative, and neutral language ratios.',
  },
  {
    icon: Eye,
    title: 'Credibility Score',
    desc: '5-factor weighted model: source reputation, attribution, emotional density, and more.',
  },
  {
    icon: Database,
    title: 'Robust Extraction',
    desc: 'Three-layer content extraction with Cheerio, Readability, and NewsAPI fallback.',
  },
];

const STATS = [
  { value: '50+', label: 'Sources tracked' },
  { value: '5',   label: 'Credibility factors' },
  { value: '< 8s',label: 'Avg analysis time'  },
  { value: '24h', label: 'Result caching'      },
];

export default function Home() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorMeta, setErrorMeta] = useState(null);
  const { user, getToken } = useAuth();

  const handleAnalyze = async (url) => {
    setLoading(true);
    setError(null);
    setErrorMeta(null);
    setResult(null);

    try {
      let token = null;
      if (user) {
        try { token = await getToken(); } catch { /* ignore */ }
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ url, userId: user?.uid }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMeta({
          userMessage: data.userMessage || data.detail || data.error || `Server error ${res.status}`,
          suggestions: data.suggestions || [],
        });
        throw new Error(data.error || `Server error ${res.status}`);
      }

      setResult(data);
    } catch (err) {
      if (!errorMeta) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setErrorMeta(null);
  };

  const showHero = !result && !loading && !error && !errorMeta;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

      {/* ── Hero ── */}
      {showHero && (
        <div className="mb-10 animate-fade-in">

          {/* Eyebrow */}
          <p className="hero-eyebrow mb-4">News Credibility Analyzer</p>

          {/* Editorial headline */}
          <h1 className="headline text-4xl sm:text-5xl mb-5 max-w-[38rem]">
            Understand what<br className="hidden sm:block" /> you're reading.
          </h1>

          <p className="hero-copy mb-8">
            TruthLens analyzes any news article for political bias, sentiment,
            emotional language, and source credibility — in seconds.
          </p>

          {/* Stats strip */}
          <div className="hero-stats">
            {STATS.map(s => (
              <div key={s.label}>
                <p className="hero-stat-value">
                  {s.value}
                </p>
                <p className="hero-stat-label">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── URL Input ── */}
      <div className={showHero ? 'mb-12' : 'mb-8'}>
        <UrlInput onAnalyze={handleAnalyze} loading={loading} />
      </div>

      {/* ── Results / Loading / Error ── */}
      {(result || loading || error || errorMeta) && (
        <AnalysisDashboard
          result={result}
          loading={loading}
          error={error}
          errorMeta={errorMeta}
          onReset={handleReset}
        />
      )}

      {/* ── Feature Grid ── */}
      {showHero && (
        <div className="mt-4">
          <p className="section-label mb-5">What TruthLens analyzes</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card animate-fade-in">
                <div className="feature-icon">
                  <f.icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1 feature-title">
                    {f.title}
                  </h3>
                  <p className="text-xs leading-relaxed feature-description">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="panel-note flex items-center justify-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              Paste any news article URL above to get started
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
