import { Link } from 'react-router-dom'

interface NavProps {
  step?: 1 | 2 | 3
}

export default function Nav({ step }: NavProps) {
  return (
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

        <nav aria-label="Main navigation" style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <Link to="/upload" className="btn btn-primary btn-sm" id="nav-upload-btn">
            Analyse contract
          </Link>
        </nav>
      </div>
    </header>
  )
}
