import { Link } from 'react-router-dom'
import Nav from '@/components/Nav'

export default function NotFound() {
  return (
    <div className="page-shell">
      <Nav />
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 'var(--space-5)',
        padding: 'var(--space-16) var(--space-6)',
        textAlign: 'center',
      }}>
        <span style={{ fontSize: '3.5rem', lineHeight: 1 }}>📄</span>
        <h2>Page not found</h2>
        <p style={{ maxWidth: '36ch', textAlign: 'center' }}>
          We couldn't find that page. Maybe the contract expired.
        </p>
        <Link to="/" className="btn btn-primary" id="not-found-home-btn">
          Back to home
        </Link>
      </main>
    </div>
  )
}
