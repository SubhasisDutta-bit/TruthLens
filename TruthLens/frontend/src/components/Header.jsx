import { useState } from 'react';
import { Search, LogIn, LogOut, Clock, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import HistoryPanel from './HistoryPanel';

export default function Header() {
  const { user, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <>
      <header className="site-header sticky top-0 z-40 w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

          {/* ── Logo ── */}
<a href="/" className="site-brand" aria-label="TruthLens home">
              <div className="site-brand-mark">
                <Search className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="site-brand-title">TruthLens</span>
              <span className="site-brand-pill">Beta</span>
          </a>

          {/* ── Nav ── */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <button
                  id="history-btn"
                  onClick={() => setShowHistory(!showHistory)}
                  className="btn-ghost hidden sm:flex"
                >
                  <Clock className="w-4 h-4" />
                  History
                </button>

                <div className="relative">
                  <button
                    id="user-menu-btn"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="nav-trigger"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: 'var(--accent)' }}
                    >
                      {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span
                      className="hidden sm:block text-sm font-medium max-w-[120px] truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {user.displayName || user.email}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                  </button>

                  {showDropdown && (
                    <div className="dropdown-menu">
                      <button
                        onClick={() => { setShowHistory(true); setShowDropdown(false); }}
                        className="nav-link sm:hidden"
                      >
                        <Clock className="w-4 h-4" /> History
                      </button>
                      <button
                        onClick={() => { logout(); setShowDropdown(false); }}
                        className="nav-link"
                        style={{ color: 'var(--red)' }}
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                id="signin-btn"
                onClick={() => setShowAuth(true)}
                className="btn-secondary text-sm"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
      {showDropdown && (
        <div className="fixed inset-0 z-30" onClick={() => setShowDropdown(false)} />
      )}
    </>
  );
}
