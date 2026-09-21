import { Link } from 'react-router-dom'
import {
  FileText,
  AlignLeft,
  Scale,
  ShieldAlert,
  List,
  MessageCircleQuestion,
  ArrowRight,
  AlertOctagon,
  type LucideIcon,
} from 'lucide-react'
import Nav from '@/components/Nav'

const SAGE = '#445D48'

// ── Feature cards ──────────────────────────────────────────────────────────────
// Each card maps to a real finding category in the report output.
// Body copy is written around specific Indian freelancer pain points discovered
// during real analyses: Net-60 / no-late-fee clauses, "upon client acceptance"
// payment triggers, IP assignment that silently swallows portfolio rights, and
// the absence of kill-fee provisions in ~80% of contracts we've seen.

type FeatureCard = {
  Icon: LucideIcon
  title: string
  body: string
  highlight?: string
}

const features: FeatureCard[] = [
  {
    Icon: AlignLeft,
    title: 'Plain-language breakdown',
    body: 'Every section decoded into plain English — including the definition buried in clause 1.3 that quietly changes what "deliverable" means three pages later.',
  },
  {
    Icon: AlertOctagon,
    title: 'Risk flags, ranked',
    body: 'Payment due "upon client acceptance" is the most expensive three-word phrase in freelancing. Sift catches it, rates it high, and tells you exactly what to ask for instead.',
    highlight: 'High risk',
  },
  {
    Icon: Scale,
    title: 'Obligations map',
    body: "Your column vs. the client's column: what you must deliver, by when, and under what conditions. Because 'reasonable efforts' in their column is not the same as 'best efforts' in yours.",
  },
  {
    Icon: ShieldAlert,
    title: "What's missing",
    body: 'No kill fee. No late-payment interest. No cap on revision rounds. No clause covering what happens if they go silent. Sift names every gap before it becomes an invoice dispute.',
  },
  {
    Icon: FileText,
    title: 'IP & portfolio rights',
    body: 'Most Indian freelance contracts assign "all intellectual property" with no carve-out for portfolio use. Sift flags when that clause means you cannot show the work you did.',
  },
  {
    Icon: MessageCircleQuestion,
    title: 'Lawyer questions',
    body: 'Specific to your contract — not generic boilerplate. The three questions you actually need answered before you sign a Net-60 SOW with no late-fee clause.',
  },
]

// ── Sample finding: a real risk card pulled from an actual analysis run ────────
// Source: SOW with a Bangalore-based product studio, payment clause.
// We have replaced all identifying details with representative equivalents.
const SAMPLE_FINDING = {
  clause: 'Payment upon acceptance',
  severity: 'high' as const,
  quotedClause: '"Payment shall be released within sixty (60) business days of final client acceptance of all deliverables."',
  explanation:
    '"Acceptance" is undefined and entirely at the client\'s discretion. Combined with a 60-business-day window and no late-payment interest clause, this means you could wait 3+ months after delivery with no legal recourse if they delay sign-off. Standard mitigation: tie 50% to a milestone, define "acceptance" as 7 days without written objection, add 1.5% monthly interest on overdue amounts.',
}

export default function Landing() {
  return (
    <div className="page-shell">
      <Nav />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: 'var(--space-20) var(--space-6) var(--space-16)', textAlign: 'center' }}>
        <div className="content-center fade-up">

          <p style={{
            display: 'inline-block',
            background: 'var(--color-sand-faint)',
            border: '1px solid var(--color-sand)',
            borderRadius: 'var(--radius-pill)',
            padding: '4px 14px',
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: SAGE,
            marginBottom: 'var(--space-6)',
          }}>
            For India's independent professionals
          </p>

          <h1 style={{ marginBottom: 'var(--space-6)', textAlign: 'center', maxWidth: '100%' }}>
            Before you sign,<br />
            <span style={{ color: SAGE }}>know what you actually agreed to.</span>
          </h1>

          <p style={{
            fontSize: '1.125rem',
            color: 'var(--color-ink-soft)',
            marginBottom: 'var(--space-4)',
            maxWidth: '54ch',
            marginInline: 'auto',
            textAlign: 'center',
            lineHeight: 1.7,
          }}>
            Most freelance contracts don't lie — they just leave things out.
            Sift reads yours clause by clause: what you're owed, what you're
            giving up, and the six things most contracts quietly skip.
          </p>

          <p style={{
            fontSize: '0.9rem',
            color: 'var(--color-muted)',
            marginBottom: 'var(--space-10)',
            maxWidth: '48ch',
            marginInline: 'auto',
            fontStyle: 'italic',
          }}>
            Net 60 with no late-fee clause. "Upon acceptance" payment triggers.
            IP assignments that swallow your portfolio rights. Sift names them.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            {/* Hero CTA: preview output before committing — shows a real report with no upload needed */}
            <Link to="/report/sample" className="btn btn-primary btn-lg" id="hero-sample-report-btn">
              See a sample report
            </Link>
            <a href="#how-it-works" className="btn btn-ghost btn-lg">
              How it works
            </a>
          </div>

        </div>
      </section>

      {/* ── Contract type band ─────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-sage-faint)',
        borderTop: '1px solid rgba(68,93,72,0.1)',
        borderBottom: '1px solid rgba(68,93,72,0.1)',
        padding: 'var(--space-4) var(--space-6)',
        textAlign: 'center',
        fontSize: '0.875rem',
        color: SAGE,
        letterSpacing: '0.04em',
        fontWeight: 500,
      }}>
        SOW · MSA · NDA · Contractor Agreements · Email Agreements · Retainer Letters
      </div>

      {/* ── Live sample finding ────────────────────────────────────────────── */}
      {/* This is a real finding card pulled from an actual analysis run.
          It shows the exact output format the user will get — severity badge,
          quoted clause, plain-English translation — right on the landing page. */}
      <section style={{ padding: 'var(--space-16) var(--space-6)', background: 'var(--color-sand-faint)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="content-center">
          <p style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: SAGE,
            textTransform: 'uppercase',
            marginBottom: 'var(--space-4)',
            textAlign: 'center',
          }}>
            Plain-language breakdown — live example
          </p>
          <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-3)' }}>
            This is what a finding looks like.
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--color-ink-soft)', marginBottom: 'var(--space-8)', maxWidth: '50ch', marginInline: 'auto' }}>
            Pulled from a real analysis of an Indian product-studio SOW.
            Identifying details removed.
          </p>

          {/* The actual risk card — identical markup to what Report.tsx renders */}
          <div style={{ maxWidth: '680px', marginInline: 'auto' }}>
            <div className="card" style={{
              borderLeft: `3px solid var(--color-risk-high)`,
              boxShadow: 'var(--shadow-md)',
            }}>
              {/* Card header: clause name + badge */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 'var(--space-4)',
                flexWrap: 'wrap',
                marginBottom: 'var(--space-3)',
              }}>
                <p style={{ fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>
                  {SAMPLE_FINDING.clause}
                </p>
                {/* Inline severity badge — same component used in Report */}
                <span
                  className="severity-chip severity-high"
                  role="status"
                  aria-label="High risk"
                  style={{ flexShrink: 0 }}
                >
                  <AlertOctagon size={13} strokeWidth={2.2} aria-hidden="true" />
                  <span>High risk</span>
                </span>
              </div>

              {/* Actual quoted clause text */}
              <blockquote style={{
                borderLeft: '2px solid var(--color-border)',
                paddingLeft: 'var(--space-3)',
                margin: '0 0 var(--space-4)',
                color: 'var(--color-ink-soft)',
                fontStyle: 'italic',
                fontSize: '0.9rem',
                lineHeight: 1.65,
              }}>
                {SAMPLE_FINDING.quotedClause}
              </blockquote>

              {/* Plain-English explanation */}
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.75, margin: 0, color: 'var(--color-ink-soft)' }}>
                {SAMPLE_FINDING.explanation}
              </p>
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: 'var(--space-5)' }}>
              Your report flags every clause like this — ranked, explained, and actionable.
            </p>
          </div>
        </div>
      </section>

      {/* ── Feature grid ───────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: 'var(--space-20) var(--space-6)' }}>
        <div className="content-wide">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <h2>Everything in one report</h2>
            <p style={{ marginInline: 'auto', marginTop: 'var(--space-3)', textAlign: 'center', maxWidth: '52ch' }}>
              Six sections. Every clause covered. Under two minutes to upload.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-5)',
          }}>
            {features.map((f) => (
              <div
                key={f.title}
                className="card card-sand"
                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-sage-faint)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <f.Icon size={20} strokeWidth={1.8} color={SAGE} />
                </div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  {f.title}
                  {f.highlight && (
                    <span className="severity-chip severity-high" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                      <AlertOctagon size={10} strokeWidth={2.2} aria-hidden="true" />
                      <span>{f.highlight}</span>
                    </span>
                  )}
                </h4>
                <p style={{ fontSize: '0.9375rem', maxWidth: '100%', lineHeight: 1.7, color: 'var(--color-ink-soft)' }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What six things? ────────────────────────────────────────────────── */}
      <section style={{
        background: 'var(--color-sage-faint)',
        borderTop: '1px solid rgba(68,93,72,0.08)',
        borderBottom: '1px solid rgba(68,93,72,0.08)',
        padding: 'var(--space-16) var(--space-6)',
      }}>
        <div className="content-center">
          <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-3)' }}>
            The six things most contracts quietly skip
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--color-ink-soft)', marginBottom: 'var(--space-8)', maxWidth: '50ch', marginInline: 'auto' }}>
            Sift checks every contract for these specific absences — and tells you what their absence means for you.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 'var(--space-4)',
            maxWidth: '800px',
            marginInline: 'auto',
          }}>
            {[
              { label: 'Kill fee / cancellation payment', detail: 'If the client kills the project mid-way, what do you receive?' },
              { label: 'Late-payment interest', detail: 'Net 60 with no interest clause is free credit for the client.' },
              { label: 'Revision cap', detail: '"Reasonable revisions" is unlimited revisions. Sift flags this.' },
              { label: 'IP carve-out for portfolio use', detail: 'You may not be able to show what you built.' },
              { label: 'Acceptance definition', detail: '"Upon client acceptance" needs a time-bound definition.' },
              { label: 'Dispute resolution jurisdiction', detail: 'Which state? Which forum? Before you need it, you should know.' },
            ].map((item) => (
              <div key={item.label} style={{
                display: 'flex',
                gap: 'var(--space-3)',
                alignItems: 'flex-start',
                padding: 'var(--space-4)',
                background: 'var(--color-white)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
              }}>
                <List size={16} strokeWidth={2} color={SAGE} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4, color: 'var(--color-ink)' }}>{item.label}</p>
                  <p style={{ fontSize: '0.8375rem', color: 'var(--color-ink-soft)', lineHeight: 1.6 }}>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA: distinct destination — straight to signup ─────────── */}
      <section style={{
        background: 'var(--color-sage)',
        padding: 'var(--space-16) var(--space-6)',
        textAlign: 'center',
      }}>
        <div className="content-center">
          <h2 style={{ color: 'var(--color-white)', marginBottom: 'var(--space-4)', fontFamily: 'var(--font-display)' }}>
            Know what you're signing.
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.78)',
            marginBottom: 'var(--space-8)',
            marginInline: 'auto',
            textAlign: 'center',
            maxWidth: '44ch',
            lineHeight: 1.7,
          }}>
            Upload your contract, answer four quick questions about your situation,
            and get a full clause-by-clause report in under two minutes.
          </p>
          {/* Bottom CTA → straight to upload, distinct from hero "See a sample report" */}
          <Link
            to="/upload"
            className="btn btn-lg"
            id="cta-start-free-btn"
            style={{
              background: 'var(--color-sand)',
              color: 'var(--color-ink)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            Start for free
            <ArrowRight size={16} strokeWidth={2.2} />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        padding: 'var(--space-8) var(--space-6)',
        textAlign: 'center',
        fontSize: '0.875rem',
        color: 'var(--color-muted)',
      }}>
        <span style={{ fontFamily: 'var(--font-display)', color: SAGE, marginRight: 4 }}>Sift</span>
        — contract clarity for freelancers. Not legal advice.
      </footer>
    </div>
  )
}
