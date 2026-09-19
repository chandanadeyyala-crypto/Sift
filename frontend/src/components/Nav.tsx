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
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`step-dot ${s < step ? 'done' : s === step ? 'active' : ''}`}
                  aria-label={`Step ${s}${s === step ? ' (current)' : s < step ? ' (complete)' : ''}`}
                />
              ))}
            </div>
          )}

          <nav aria-label="Main navigation" style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginRight: '48px' }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    fontSize: '0.85rem',
                    color: 'var(--color-ink)',
                    backgroundColor: 'var(--color-sage-faint)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--color-border)',
                  }}
                >
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
                  <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <button
                  type="button"
                  onClick={() => openAuth('login')}
                  className="btn btn-ghost btn-sm"
                  id="nav-login-btn"
                  style={{ padding: '6px 12px', fontSize: '0.875rem' }}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => openAuth('signup')}
                  className="btn btn-secondary btn-sm"
                  id="nav-signup-btn"
                  style={{ padding: '6px 14px', fontSize: '0.875rem' }}
                >
                  Sign Up
                </button>
              </div>
            )}

            <Link to="/upload" className="btn btn-primary btn-sm" id="nav-upload-btn">
              Analyse contract
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
