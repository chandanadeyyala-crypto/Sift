import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Nav from '@/components/Nav'
import RiskBadge from '@/components/RiskBadge'
import { getReport, ReportResponse, RiskItem } from '@/lib/api'

export default function Report() {
  const { sessionId }             = useParams<{ sessionId: string }>()
  const [report, setReport]       = useState<ReportResponse | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return
    getReport(sessionId)
      .then(setReport)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load report.'))
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) return <LoadingState />
  if (error)   return <ErrorState message={error} />
  if (!report) return null

  return (
    <div className="page-shell">
      <Nav step={3} />

      <main style={{ flex: 1, padding: 'var(--space-10) var(--space-6) var(--space-20)' }}>
        <div className="content-center fade-up">

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
            <div className="step-bar">
              <div className="step-dot done" />
              <div className="step-dot done" />
              <div className="step-dot active" />
            </div>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>Step 3 of 3 — Your report</span>
          </div>

          {/* Header */}
          <div style={{ marginBottom: 'var(--space-10)' }}>
            <h2 style={{ marginBottom: 'var(--space-3)' }}>Contract Report</h2>
            <p style={{ maxWidth: '100%' }}>
              Generated {new Date(report.generatedAt).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}. This is not legal advice.
            </p>
          </div>

          {/* Summary card */}
          <Section title="Summary" icon="📋">
            <p style={{ maxWidth: '100%', lineHeight: 1.75 }}>{report.summary}</p>
          </Section>

          {/* Plain language */}
          <Section title="What it actually says" icon="📖">
            <div style={{ lineHeight: 1.85, maxWidth: '100%' }}
              dangerouslySetInnerHTML={{ __html: report.plainLanguage.replace(/\n/g, '<br/>') }} />
          </Section>

          {/* Risks */}
          <Section title="Risk flags" icon="⚠️">
            {report.risks.length === 0 ? (
              <p style={{ maxWidth: '100%' }}>No significant risks identified.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {report.risks.map((risk: RiskItem, i: number) => (
                  <RiskCard key={i} risk={risk} />
                ))}
              </div>
            )}
          </Section>

          {/* Missing clauses */}
          <Section title="What's missing" icon="🔍">
            {report.missing.length === 0 ? (
              <p style={{ maxWidth: '100%' }}>No missing clauses identified.</p>
            ) : (
              <ul style={{ paddingLeft: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {report.missing.map((item, i) => (
                  <li key={i} style={{ color: 'var(--color-ink-soft)', lineHeight: 1.65 }}>{item}</li>
                ))}
              </ul>
            )}
          </Section>

          {/* Obligations */}
          <Section title="Who owes what" icon="⚖️">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
              <ObligationList title="You owe" items={report.obligations.yours} />
              <ObligationList title="Client owes" items={report.obligations.clients} />
            </div>
          </Section>

          {/* Lawyer questions */}
          <Section title="Questions for your lawyer" icon="💬">
            <p style={{ marginBottom: 'var(--space-4)', maxWidth: '100%', fontSize: '0.9rem' }}>
              If this contract warrants legal review, bring these to your session:
            </p>
            <ol style={{ paddingLeft: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {report.lawyerQuestions.map((q, i) => (
                <li key={i} style={{ color: 'var(--color-ink-soft)', lineHeight: 1.65 }}>{q}</li>
              ))}
            </ol>
          </Section>

          {/* Disclaimer + actions */}
          <div className="card card-sand" style={{ marginTop: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <p style={{ fontSize: '0.875rem', maxWidth: '100%', color: 'var(--color-ink-soft)' }}>
              <strong>Not legal advice.</strong> Sift helps you understand contracts faster, but it doesn't replace a qualified lawyer for high-stakes agreements.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <Link to="/upload" className="btn btn-primary btn-sm" id="report-analyse-another-btn">
                Analyse another contract
              </Link>
              <button
                className="btn btn-ghost btn-sm"
                id="report-print-btn"
                onClick={() => window.print()}
              >
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

/* ── Sub-components ───────────────────────────────────────── */

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 'var(--space-10)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        <span style={{ fontSize: '1.25rem' }}>{icon}</span>
        <h3 style={{ margin: 0 }}>{title}</h3>
      </div>
      <hr className="divider" style={{ margin: '0 0 var(--space-5)' }} />
      {children}
    </div>
  )
}

function RiskCard({ risk }: { risk: RiskItem }) {
  return (
    <div className="card" style={{ borderLeft: '3px solid var(--color-border)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
        <p style={{ fontWeight: 500, color: 'var(--color-ink)', margin: 0, maxWidth: '100%' }}>
          {risk.clause}
        </p>
        <RiskBadge severity={risk.severity} />
      </div>
      <p style={{ fontSize: '0.9375rem', maxWidth: '100%', lineHeight: 1.7, margin: 0 }}>{risk.explanation}</p>
    </div>
  )
}

function ObligationList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="card card-sage" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <h4 style={{ fontFamily: 'var(--font-body)' }}>{title}</h4>
      <ul style={{ paddingLeft: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {items.map((item, i) => (
          <li key={i} style={{ color: 'var(--color-ink-soft)', fontSize: '0.9rem', lineHeight: 1.6 }}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="page-shell">
      <Nav step={3} />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
        <p style={{ color: 'var(--color-muted)' }}>Loading your report…</p>
      </main>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="page-shell">
      <Nav />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 'var(--space-5)', padding: 'var(--space-12)' }}>
        <span style={{ fontSize: '2.5rem' }}>⚠️</span>
        <h3>Couldn't load report</h3>
        <p style={{ textAlign: 'center', maxWidth: '40ch' }}>{message}</p>
        <Link to="/upload" className="btn btn-primary">Try again</Link>
      </main>
    </div>
  )
}
