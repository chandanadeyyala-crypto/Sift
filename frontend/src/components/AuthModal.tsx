import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'signup'
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const { login, signup, loginWithGoogle } = useAuth()

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await signup(email, password, name)
      }
      onClose()
    } catch (err: any) {
      const msg = err?.code?.replace('auth/', '').replace(/-/g, ' ') || err?.message || 'Authentication error'
      setLocalError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogle() {
    setLocalError(null)
    setSubmitting(true)
    try {
      await loginWithGoogle()
      onClose()
    } catch (err: any) {
      const msg = err?.code?.replace('auth/', '').replace(/-/g, ' ') || err?.message || 'Google sign-in error'
      setLocalError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 28, 28, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'var(--space-4)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: 'var(--color-white)',
          padding: 'var(--space-8)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 'var(--space-4)',
            right: 'var(--space-4)',
            background: 'none',
            border: 'none',
            fontSize: '1.25rem',
            cursor: 'pointer',
            color: 'var(--color-muted)',
            lineHeight: 1,
          }}
          aria-label="Close"
        >
          ×
        </button>

        <h3 style={{ marginBottom: 'var(--space-2)' }}>
          {mode === 'login' ? 'Sign in to Sift' : 'Create your account'}
        </h3>
        <p style={{ fontSize: '0.875rem', marginBottom: 'var(--space-6)', color: 'var(--color-muted)' }}>
          {mode === 'login'
            ? 'Access your saved contract reports anytime.'
            : 'Save, re-visit, and translate all your contract reviews.'}
        </p>

        {localError && (
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: '#FDF2ED',
              border: '1px solid #E8B4A2',
              borderRadius: 'var(--radius-md)',
              color: '#8A2C0A',
              fontSize: '0.85rem',
              marginBottom: 'var(--space-4)',
              textTransform: 'capitalize',
            }}
          >
            {localError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                Your Name
              </label>
              <input
                type="text"
                className="input"
                placeholder="Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
              Email address
            </label>
            <input
              type="email"
              className="input"
              placeholder="alex@freelancer.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
              Password
            </label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 'var(--space-2)' }}
            disabled={submitting}
          >
            {submitting ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', margin: 'var(--space-6) 0' }}>
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--color-border)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', textTransform: 'uppercase' }}>or</span>
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--color-border)' }} />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={submitting}
          className="btn btn-ghost"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>

        <p style={{ fontSize: '0.85rem', marginTop: 'var(--space-6)', textAlign: 'center', color: 'var(--color-muted)' }}>
          {mode === 'login' ? "Don't have an account yet?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setLocalError(null)
              setMode(mode === 'login' ? 'signup' : 'login')
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-sage)',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
