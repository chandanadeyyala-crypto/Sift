import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Nav from '@/components/Nav'
import { submitAnswers } from '@/lib/api'

interface Question {
  id: string
  label: string
  type: 'text' | 'select' | 'radio'
  options?: string[]
  placeholder?: string
  required?: boolean
}

const QUESTIONS: Question[] = [
  {
    id: 'role',
    label: "What's your role in this contract?",
    type: 'radio',
    options: ['Freelancer / Contractor', 'Consultant', 'Agency', 'Employee (reviewing offer)', 'Other'],
    required: true,
  },
  {
    id: 'contractType',
    label: 'What type of contract do you think this is?',
    type: 'radio',
    options: ['Statement of Work (SOW)', 'Master Services Agreement (MSA)', 'NDA', 'Contractor Agreement', 'Email / informal agreement', 'Not sure'],
    required: true,
  },
  {
    id: 'jurisdiction',
    label: 'Which country or state does this contract operate under?',
    type: 'text',
    placeholder: 'e.g. California, USA or England & Wales',
    required: false,
  },
  {
    id: 'concerns',
    label: "Anything specific you're worried about or want us to focus on?",
    type: 'text',
    placeholder: 'e.g. IP ownership, late payment, non-compete, termination terms…',
    required: false,
  },
]

export default function Questions() {
  const { sessionId }                     = useParams<{ sessionId: string }>()
  const navigate                          = useNavigate()
  const [answers, setAnswers]             = useState<Record<string, string>>({})
  const [current, setCurrent]             = useState(0)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [animKey, setAnimKey]             = useState(0)

  const q = QUESTIONS[current]
  const isLast = current === QUESTIONS.length - 1

  useEffect(() => {
    setAnimKey((k) => k + 1)
  }, [current])

  function handleAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [q.id]: value }))
  }

  function canAdvance() {
    if (!q.required) return true
    return Boolean(answers[q.id]?.trim())
  }

  async function handleNext() {
    if (!canAdvance()) return
    if (!isLast) {
      setCurrent((c) => c + 1)
      return
    }
    // Last question — submit
    setLoading(true)
    setError(null)
    try {
      await submitAnswers({ sessionId: sessionId!, answers })
      navigate(`/report/${sessionId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleBack() {
    if (current > 0) setCurrent((c) => c - 1)
  }

  const progress = ((current + 1) / QUESTIONS.length) * 100

  return (
    <div className="page-shell">
      <Nav step={2} />

      <main style={{ flex: 1, padding: 'var(--space-12) var(--space-6)' }}>
        <div className="content-center">

          {/* Top nav row: step indicator + back link */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div className="step-bar">
                <div className="step-dot done" />
                <div className="step-dot active" />
                <div className="step-dot" />
              </div>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                Step 2 of 3 — Quick questions
              </span>
            </div>
            <Link to="/upload" className="btn btn-ghost btn-sm" id="questions-back-upload-btn">
              ← Back to upload
            </Link>
          </div>

          {/* Progress bar */}
          <div style={{
            height: 4,
            background: 'var(--color-border)',
            borderRadius: 'var(--radius-pill)',
            marginBottom: 'var(--space-10)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'var(--color-sage)',
              borderRadius: 'var(--radius-pill)',
              transition: 'width 0.4s ease',
            }} />
          </div>

          {/* Question card */}
          <div key={animKey} className="card fade-up" style={{ marginBottom: 'var(--space-6)' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginBottom: 'var(--space-3)', maxWidth: '100%' }}>
              Question {current + 1} of {QUESTIONS.length}
            </p>

            <h3 style={{ marginBottom: 'var(--space-6)', maxWidth: '100%' }}>{q.label}</h3>

            {q.type === 'radio' && q.options && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {q.options.map((opt) => (
                  <label
                    key={opt}
                    id={`option-${opt.replace(/\s+/g, '-').toLowerCase()}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${answers[q.id] === opt ? 'var(--color-sage)' : 'var(--color-border)'}`,
                      background: answers[q.id] === opt ? 'var(--color-sage-faint)' : 'var(--color-white)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      fontWeight: answers[q.id] === opt ? 500 : 400,
                      color: 'var(--color-ink)',
                    }}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={() => handleAnswer(opt)}
                      style={{ accentColor: 'var(--color-sage)' }}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {q.type === 'text' && (
              <textarea
                id={`question-${q.id}`}
                className="input textarea"
                placeholder={q.placeholder}
                value={answers[q.id] ?? ''}
                onChange={(e) => handleAnswer(e.target.value)}
                rows={3}
              />
            )}
          </div>

          {error && (
            <div style={{
              marginBottom: 'var(--space-4)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-risk-high)',
              color: 'var(--color-risk-high)',
              fontSize: '0.9rem',
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            {current === 0 ? (
              <Link
                to="/upload"
                className="btn btn-ghost"
                id="questions-back-btn"
              >
                ← Back
              </Link>
            ) : (
              <button
                className="btn btn-ghost"
                onClick={handleBack}
                id="questions-back-btn"
              >
                ← Back
              </button>
            )}

            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={!canAdvance() || loading}
              id="questions-next-btn"
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                  Analysing…
                </>
              ) : isLast ? (
                'Generate Report →'
              ) : (
                'Next →'
              )}
            </button>
          </div>

          {!QUESTIONS[current].required && (
            <p style={{
              textAlign: 'center',
              marginTop: 'var(--space-4)',
              fontSize: '0.8125rem',
              color: 'var(--color-muted)',
            }}>
              This question is optional — you can skip it.
            </p>
          )}

          {/* Escape hatch: start completely over */}
          <div style={{ textAlign: 'center', marginTop: 'var(--space-8)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--color-border)' }}>
            <Link
              to="/"
              style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}
              id="questions-start-over-btn"
            >
              Start over from home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
