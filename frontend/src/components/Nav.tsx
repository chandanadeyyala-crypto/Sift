import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AuthModal from './AuthModal'
import FlowingLeaf from './FlowingLeaf'

interface NavProps {
  step?: 1 | 2 | 3
}

export default function Nav({ step }: NavProps) {
  const { user, logout } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  function openAuth(mode: 'login' | 'signup') {
    setAuthMode(mode)
    setAuthModalOpen(true)
  }

  return (
    <>
      <header className="nav" role="banner">
        <div className="nav-inner">
          <Link to="/" className="nav-logo" aria-label="Sift home">
            Sift<span>.</span>
          </Link>

          {step && (
            <div className="nav-step-dots" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`step-dot ${s < step ? 'done' : s === step ? 'active' : ''}`}
                  aria-label={`Step ${s}${s === step ? ' (current)' : s < step ? ' (complete)' : ''}`}
                />
              ))}
            </div>
          )}

          <nav aria-label="Main navigation" className="nav-menu">
            {user ? (
              <div className="nav-auth-group">
                <div className="nav-user-badge">
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-sage)',
                      color: 'var(--color-white)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </span>
                  <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="btn btn-ghost btn-sm nav-btn-compact"
                  style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="nav-auth-group">
                <button
                  type="button"
                  onClick={() => openAuth('login')}
                  className="btn btn-ghost btn-sm nav-btn-compact"
                  id="nav-login-btn"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => openAuth('signup')}
                  className="btn btn-secondary btn-sm nav-btn-compact"
                  id="nav-signup-btn"
                >
                  Sign Up
                </button>
              </div>
            )}

            <Link to="/upload" className="btn btn-primary btn-sm nav-btn-compact" id="nav-upload-btn">
              <span className="nav-btn-text-full">Analyse contract</span>
              <span className="nav-btn-text-short">Analyse</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Floating animated leaf on top right of page */}
      <FlowingLeaf />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  )
}
