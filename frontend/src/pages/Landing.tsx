import { Link } from 'react-router-dom'
import Nav from '@/components/Nav'

const features = [
  {
    icon: '📄',
    title: 'Upload any contract',
    body: 'SOW, MSA, NDA, contractor agreement, or even a screenshot of an email. Sift reads it all.',
  },
  {
    icon: '🔍',
    title: 'Plain-language breakdown',
    body: 'No legalese. Sift explains every clause in clear, concise English you can actually use.',
  },
  {
    icon: '⚠️',
    title: 'Risk flagging',
    body: 'High, medium, and low-severity issues are surfaced with icons and plain labels — never hidden.',
  },
  {
    icon: '📋',
    title: "What's missing",
    body: 'Sift spots absent clauses — no IP ownership, no kill-fee, no dispute resolution — before you sign.',
  },
  {
    icon: '⚖️',
    title: 'Obligations map',
    body: 'Exactly what you owe vs. what your client owes. No ambiguity, no surprises mid-project.',
  },
  {
    icon: '💬',
    title: 'Lawyer questions',
    body: 'A tailored list of questions to bring to a lawyer if this contract warrants it.',
  },
]

export default function Landing() {
  return (
    <div className="page-shell">
      <Nav />

      {/* Hero */}
      <section style={{ padding: 'var(--space-20) var(--space-6) var(--space-16)', textAlign: 'center' }}>
        <div className="content-center fade-up" style={{ textAlign: 'center' }}>
          <p style={{
            display: 'inline-block',
            background: 'var(--color-sand-faint)',
            border: '1px solid var(--color-sand)',
            borderRadius: 'var(--radius-pill)',
            padding: '4px 14px',
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: 'var(--color-sage)',
            marginBottom: 'var(--space-6)',
          }}>
            For freelancers, by freelancers
          </p>

          <h1 style={{ marginBottom: 'var(--space-6)', textAlign: 'center', maxWidth: '100%' }}>
            Read your contract<br />
            <span style={{ color: 'var(--color-sage)' }}>before it reads you.</span>
          </h1>

          <p style={{
            fontSize: '1.125rem',
            color: 'var(--color-ink-soft)',
            marginBottom: 'var(--space-10)',
            maxWidth: '52ch',
            marginInline: 'auto',
            textAlign: 'center',
          }}>
            Upload or photograph any freelance contract. Sift asks a few quick questions
            about your situation, then gives you a plain-language report — what it says,
            what it means, what's risky, and what's missing.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/upload" className="btn btn-primary btn-lg">
              Analyse a contract →
            </Link>
            <a href="#how-it-works" className="btn btn-ghost btn-lg">
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* Divider illustration band */}
      <div style={{
        background: 'var(--color-sage-faint)',
        borderTop: '1px solid rgba(68,93,72,0.1)',
        borderBottom: '1px solid rgba(68,93,72,0.1)',
        padding: 'var(--space-4) var(--space-6)',
        textAlign: 'center',
        fontSize: '0.875rem',
        color: 'var(--color-sage)',
        letterSpacing: '0.03em',
      }}>
        SOW · MSA · NDA · Contractor Agreements · Email Agreements · Retainer Letters
      </div>

      {/* Features grid */}
      <section id="how-it-works" style={{ padding: 'var(--space-20) var(--space-6)' }}>
        <div className="content-wide">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <h2>Everything in one report</h2>
            <p style={{ marginInline: 'auto', marginTop: 'var(--space-3)', textAlign: 'center' }}>
              Stop squinting at legalese at 11 pm before a deadline. Sift does the reading for you.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-5)',
          }}>
            {features.map((f) => (
              <div key={f.title} className="card card-sand" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <span style={{ fontSize: '1.75rem' }}>{f.icon}</span>
                <h4>{f.title}</h4>
                <p style={{ fontSize: '0.9375rem', maxWidth: '100%' }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section style={{
        background: 'var(--color-sage)',
        padding: 'var(--space-16) var(--space-6)',
        textAlign: 'center',
      }}>
        <div className="content-center">
          <h2 style={{ color: 'var(--color-white)', marginBottom: 'var(--space-4)' }}>
            Know what you're signing.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.78)', marginBottom: 'var(--space-8)', marginInline: 'auto', textAlign: 'center' }}>
            It takes under two minutes to get a full contract report.
          </p>
          <Link to="/upload" className="btn btn-lg" style={{
            background: 'var(--color-sand)',
            color: 'var(--color-ink)',
          }}>
            Start for free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        padding: 'var(--space-8) var(--space-6)',
        textAlign: 'center',
        fontSize: '0.875rem',
        color: 'var(--color-muted)',
      }}>
        <span style={{ fontFamily: 'var(--font-display)', color: 'var(--color-sage)', marginRight: 4 }}>Sift</span>
        — contract clarity for freelancers. Not legal advice.
      </footer>
    </div>
  )
}
