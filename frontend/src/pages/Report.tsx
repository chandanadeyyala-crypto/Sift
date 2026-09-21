import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import Nav from '@/components/Nav'
import RiskBadge from '@/components/RiskBadge'
import {
  getReport,
  askQuestion,
  translateReport,
  ReportResponse,
  RiskItem,
} from '@/lib/api'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  ts: string
}

const SAMPLE_REPORT: ReportResponse = {
  sessionId: 'sample',
  summary: 'Bangalore Studio Freelance Master Services Agreement (MSA) & SOW for Product Design.',
  plainLanguage: 'This is a standard client-favored services agreement. While the scope of work is clear, the payment and liability terms expose you to significant delayed payment and unlimited liability risks. Specific attention is needed on clause 4 (Payment upon acceptance) and clause 9 (IP assignment).',
  risks: [
    {
      clause: 'Payment upon acceptance (Clause 4.2)',
      severity: 'high',
      explanation: '"Payment shall be released within sixty (60) business days of final client acceptance of all deliverables." Acceptance is undefined and entirely at the client\'s discretion, stretching payment out to 3+ months with no late fee.',
    },
    {
      clause: 'Unlimited Indemnity & Liability (Clause 8.1)',
      severity: 'high',
      explanation: 'You are required to indemnify the client against any third-party claims without an aggregate liability cap, while the client caps their total liability to fees paid in the preceding month.',
    },
    {
      clause: 'Work-for-hire IP Assignment prior to full payment (Clause 9.3)',
      severity: 'medium',
      explanation: 'IP transfers automatically upon creation rather than upon receipt of full payment. If the client delays or defaults on payment, you have already assigned ownership of your designs.',
    },
    {
      clause: 'Post-Termination Non-Solicitation Restraint (Clause 12.1)',
      severity: 'medium',
      explanation: 'Restricts you from performing services for any client contacts or partner vendors for 12 months after contract completion.',
    },
  ],
  missing: [
    'Late payment interest clause (standard 1.5% per month for Indian MSME/freelancers)',
    'Deemed acceptance period (acceptance deemed granted if client provides no written feedback within 7 business days)',
    'Portfolio and case-study usage rights for non-confidential deliverables',
    'Kill fee / pro-rata compensation for work completed prior to early convenience termination',
  ],
  obligations: {
    yours: [
      'Deliver completed design tokens and wireframes per the project timeline',
      'Provide up to two rounds of design revisions per sprint',
      'Protect confidential client materials for 2 years post-engagement',
    ],
    clients: [
      'Provide brand guidelines and assets within 3 business days of kickoff',
      'Designate a single authorized stakeholder for deliverable approvals',
      'Pay invoiced milestones according to agreed payment terms',
    ],
  },
  lawyerQuestions: [
    'Can we insert a 7-day deemed acceptance clause so client review delays don\'t postpone invoice approvals?',
    'Can we cap my total liability under this agreement to 100% of the total fees actually received?',
    'Can we clarify that intellectual property rights transfer only upon receipt of full and final payment?',
  ],
  generatedAt: new Date().toISOString(),
}

const SAMPLE_REPORT_HINDI: ReportResponse = {
  ...SAMPLE_REPORT,
  summary: 'बैंगलोर स्टूडियो फ्रीलांस मास्टर सर्विसेज एग्रीमेंट (MSA) और प्रोडक्ट डिज़ाइन के लिए SOW।',
  plainLanguage: 'यह एक मानक अनुबंध है जो क्लाइंट के पक्ष में झुका हुआ है। हालांकि काम का दायरा स्पष्ट है, लेकिन भुगतान और देयता (liability) की शर्तें आपके लिए भुगतान में देरी और असीमित जोखिम पैदा करती हैं। विशेष रूप से धारा 4 (स्वीकृति पर भुगतान) और धारा 9 (IP असाइनमेंट) पर ध्यान देने की आवश्यकता है।',
  risks: [
    {
      clause: 'स्वीकृति पर भुगतान (धारा 4.2)',
      severity: 'high',
      explanation: '"सभी डिलिवरेबल्स की अंतिम क्लाइंट स्वीकृति के 60 व्यावसायिक दिनों के भीतर भुगतान जारी किया जाएगा।" स्वीकृति की कोई स्पष्ट परिभाषा नहीं है, जिससे 3+ महीने तक भुगतान में देरी हो सकती है और कोई विलंब शुल्क भी नहीं है।',
    },
    {
      clause: 'असीमित क्षतिपूर्ति और देयता (धारा 8.1)',
      severity: 'high',
      explanation: 'आपको बिना किसी सीमा के तीसरे पक्ष के दावों के लिए क्लाइंट की क्षतिपूर्ति करनी होगी, जबकि क्लाइंट की देयता पिछले महीने भुगतान किए गए शुल्क तक सीमित है।',
    },
    {
      clause: 'पूर्ण भुगतान से पहले IP असाइनमेंट (धारा 9.3)',
      severity: 'medium',
      explanation: 'बौद्धिक संपदा (IP) निर्माण के समय ही ट्रांसफर हो जाती है, न कि पूर्ण भुगतान मिलने पर। यदि क्लाइंट भुगतान में चूक करता है, तो भी स्वामित्व उनके पास चला जाएगा।',
    },
    {
      clause: 'समाप्ति के बाद गैर-प्रलोभन प्रतिबंध (धारा 12.1)',
      severity: 'medium',
      explanation: 'अनुबंध पूरा होने के बाद 12 महीने तक क्लाइंट के किसी भी संपर्क या सहयोगी के साथ काम करने पर रोक लगाता है।',
    },
  ],
  missing: [
    'विलंबित भुगतान पर ब्याज खंड (भारतीय MSME/फ्रीलांसरों के लिए 1.5% प्रति माह मानक)',
    'स्वतः स्वीकृति अवधि (यदि 7 दिनों में कोई लिखित आपत्ति नहीं है तो स्वीकृति मानी जाएगी)',
    'पोर्टफोलियो और केस-स्टडी में काम दिखाने का अधिकार',
    'जल्दी अनुबंध समाप्त होने पर किए गए कार्य का आनुपातिक भुगतान (Kill Fee)',
  ],
}

const SAMPLE_REPORT_TELUGU: ReportResponse = {
  ...SAMPLE_REPORT,
  summary: 'బెంగళూరు స్టూడియో ఫ్రీలాన్స్ మాస్టర్ సర్వీసెస్ అగ్రిమెంట్ (MSA) మరియు ప్రాడక్ట్ డిజైన్ కొరకు SOW.',
  plainLanguage: 'ఇది క్లయింట్‌కు అనుకూలంగా రూపొందించబడిన ప్రామాణిక ఒప్పందం. పని పరిధి స్పష్టంగా ఉన్నప్పటికీ, చెల్లింపు మరియు బాధ్యత నిబంధనలు మీకు ఆలస్య చెల్లింపులు మరియు అధిక నష్టభయాన్ని కలిగిస్తాయి. నిబంధన 4 (ఆమోదంపై చెల్లింపు) మరియు నిబంధన 9 (IP బదిలీ) పై ప్రత్యేక శ్రద్ధ అవసరం.',
  risks: [
    {
      clause: 'ఆమోదం తర్వాతే చెల్లింపు (నిబంధన 4.2)',
      severity: 'high',
      explanation: '"తుది క్లయింట్ ఆమోదం పొందిన అరవై (60) పనిదినాల్లోపు చెల్లింపు విడుదల చేయబడుతుంది." ఆమోదానికి సరైన గడువు లేకపోవడం వల్ల చెల్లింపు 3 నెలలకు పైగా ఆలస్యం కావచ్చు మరియు ఎటువంటి ఆలస్య వడ్డీ కూడా ఉండదు.',
    },
    {
      clause: 'అపరిమిత నష్టపరిహార బాధ్యత (నిబంధన 8.1)',
      severity: 'high',
      explanation: 'ఎటువంటి పరిమితి లేకుండా క్లయింట్‌కు పూర్తి నష్టపరిహారం చెల్లించాల్సిన బాధ్యత మీపై ఉంటుంది, కానీ క్లయింట్ బాధ్యత కేవలం గత నెల ఫీజుకే పరిమితం చేయబడింది.',
    },
    {
      clause: 'పూర్తి చెల్లింపు రాకముందే IP బదిలీ (నిబంధన 9.3)',
      severity: 'medium',
      explanation: 'పూర్తి చెల్లింపు అందిన తర్వాత కాకుండా, డిజైన్ రూపొందించిన వెంటనే హక్కులు క్లయింట్‌కు బదిలీ అవుతాయి. క్లయింట్ చెల్లింపులో విఫలమైనా డిజైన్ల యాజమాన్యం వారిదే అవుతుంది.',
    },
    {
      clause: 'ఒప్పందం ముగిసిన తర్వాత ఇతర క్లయింట్లతో పని చేయకూడదనే నిబంధన (నిబంధన 12.1)',
      severity: 'medium',
      explanation: 'ప్రాజెక్ట్ పూర్తయిన 12 నెలల వరకు క్లయింట్ సంబంధీకులతో లేదా భాగస్వాములతో కలిసి పనిచేయకుండా నిరోధిస్తుంది.',
    },
  ],
  missing: [
    'ఆలస్య చెల్లింపులపై వడ్డీ నిబంధన (నెలకి 1.5% ప్రామాణిక వడ్డీ)',
    '7 పనిదినాల్లో లిఖితపూర్వక అభ్యంతరం తెలపకపోతే ఆమోదించినట్లు పరిగణించే నిబంధన',
    'పూర్తయిన పనిని మీ పోర్ట్‌ఫోలియో మరియు కేస్ స్టడీలలో ప్రదర్శించే హక్కు',
    'ఒప్పందం అర్ధాంతరంగా రద్దయితే చేసిన పనికి చెల్లింపు (కిల్ ఫీ)',
  ],
}

export default function Report() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const isSample = sessionId === 'sample'
  const [baseReport, setBaseReport] = useState<ReportResponse | null>(null)
  const [translations, setTranslations] = useState<Record<string, ReportResponse>>({})
  const [currentLang, setCurrentLang] = useState<'en' | 'Hindi' | 'Telugu'>('en')
  const [translating, setTranslating] = useState(false)
  const [translateError, setTranslateError] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Follow-up Q&A state
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [askError, setAskError] = useState<string | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sessionId) return

    if (sessionId === 'sample') {
      setBaseReport(SAMPLE_REPORT)
      setTranslations({
        en: SAMPLE_REPORT,
        Hindi: SAMPLE_REPORT_HINDI,
        Telugu: SAMPLE_REPORT_TELUGU,
      })
      setLoading(false)
      return
    }

    getReport(sessionId)
      .then((data) => {
        setBaseReport(data)
        setTranslations({ en: data })
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load report.')
      )
      .finally(() => setLoading(false))
  }, [sessionId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  // Translate handler
  async function handleLanguageChange(targetLang: 'en' | 'Hindi' | 'Telugu') {
    if (targetLang === currentLang || !sessionId || !baseReport) return

    setTranslateError(null)

    if (targetLang === 'en') {
      setCurrentLang('en')
      return
    }

    if (translations[targetLang]) {
      setCurrentLang(targetLang)
      return
    }

    // Sample mode: translations are pre-baked above, should never reach here
    if (isSample) {
      setCurrentLang(targetLang)
      return
    }

    setTranslating(true)
    try {
      const res = await translateReport({ sessionId, targetLanguage: targetLang })
      setTranslations((prev) => ({ ...prev, [targetLang]: res }))
      setCurrentLang(targetLang)
    } catch (err: unknown) {
      setTranslateError(
        err instanceof Error
          ? err.message
          : `Failed to translate to ${targetLang}. Please try again.`
      )
    } finally {
      setTranslating(false)
    }
  }

  // Follow-up question submit
  async function handleAskSubmit(e?: React.FormEvent, customQuestion?: string) {
    if (e) e.preventDefault()
    const q = (customQuestion || question).trim()
    if (!q || !sessionId || asking) return

    setAskError(null)
    setAsking(true)
    const userMsg: ChatMessage = {
      role: 'user',
      content: q,
      ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setChatHistory((prev) => [...prev, userMsg])
    setQuestion('')

    // Sample mode: return a canned demo answer without touching the backend
    if (isSample) {
      setTimeout(() => {
        setChatHistory((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: "This is a sample contract preview. Upload your own contract to get a real answer specific to your agreement's clauses.",
            ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ])
        setAsking(false)
      }, 600)
      return
    }

    try {
      const res = await askQuestion({
        sessionId,
        question: q,
        history: chatHistory.map((m) => ({ role: m.role, content: m.content })),
      })

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: res.answer,
        ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setChatHistory((prev) => [...prev, assistantMsg])
    } catch (err: unknown) {
      setAskError(
        err instanceof Error ? err.message : 'Failed to get answer. Please try again.'
      )
    } finally {
      setAsking(false)
    }
  }

  // Clean PDF print
  function handlePrintPDF() {
    const originalTitle = document.title
    document.title = `Sift-Contract-Report-${(sessionId || 'doc').slice(0, 8)}`
    window.print()
    document.title = originalTitle
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!baseReport) return null

  const activeReport = translations[currentLang] || baseReport

  const quickQuestions = [
    'Can I work for other clients in the same industry?',
    'What happens if the client delays or withholds payment?',
    'Who owns the intellectual property and preliminary drafts?',
    'What are the notice period and termination terms?',
  ]

  return (
    <div className="page-shell">
      <Nav step={3} />

      {/* Sample mode banner */}
      {isSample && (
        <div
          className="no-print"
          style={{
            background: 'linear-gradient(135deg, var(--color-sage-faint) 0%, rgba(68,93,72,0.08) 100%)',
            borderBottom: '1px solid rgba(68,93,72,0.18)',
            padding: 'var(--space-3) var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.875rem', color: 'var(--color-ink-soft)' }}>
            <strong style={{ color: 'var(--color-sage)' }}>Sample report</strong>
            {' '}— This is a real analysis of a Bangalore studio contract, anonymised for this preview.
          </span>
          <Link
            to="/upload"
            className="btn btn-primary"
            style={{ fontSize: '0.875rem', padding: '6px 16px', whiteSpace: 'nowrap' }}
          >
            Analyse your contract →
          </Link>
        </div>
      )}

      <main style={{ flex: 1, padding: 'var(--space-10) var(--space-6) var(--space-20)' }}>
        <div className="content-center fade-up">

          {/* Top nav row — hidden for sample */}
          {!isSample && (
            <div
              className="no-print"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div className="step-bar">
                  <div className="step-dot done" />
                  <div className="step-dot done" />
                  <div className="step-dot active" />
                </div>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                  Step 3 of 3 — Your report
                </span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <Link to="/upload" className="btn btn-ghost btn-sm" id="report-back-upload-btn">
                  ← Upload new
                </Link>
                <Link to="/" className="btn btn-ghost btn-sm" id="report-home-btn">
                  Home
                </Link>
              </div>
            </div>
          )}

          {/* AI Language Translation Selector */}
          <div
            id="report-lang-selector"
            className="no-print report-lang-bar"
            style={{
              marginBottom: 'var(--space-6)',
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: 'var(--color-sand-faint)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: '1.1rem' }}>🌐</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ink)' }}>
                Language / భాష / भाषा:
              </span>
              {translating && (
                <span style={{ fontSize: '0.8rem', color: 'var(--color-sage)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  Translating with AI…
                </span>
              )}
            </div>

            <div className="report-lang-buttons">
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`btn btn-sm ${currentLang === 'en' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.8rem', padding: '4px 12px' }}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('Hindi')}
                disabled={translating}
                className={`btn btn-sm ${currentLang === 'Hindi' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.8rem', padding: '4px 12px' }}
              >
                हिन्दी (Hindi)
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('Telugu')}
                disabled={translating}
                className={`btn btn-sm ${currentLang === 'Telugu' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.8rem', padding: '4px 12px' }}
              >
                తెలుగు (Telugu)
              </button>
            </div>
          </div>

          {translateError && (
            <div
              className="no-print"
              style={{
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: '#FDF2ED',
                border: '1px solid #E8B4A2',
                borderRadius: 'var(--radius-md)',
                color: '#8A2C0A',
                fontSize: '0.85rem',
                marginBottom: 'var(--space-6)',
              }}
            >
              ⚠️ {translateError}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              PRINTABLE REPORT CONTAINER
              Only the elements inside this div will be saved/printed to PDF!
              ════════════════════════════════════════════════════════════ */}
          <div id="report-printable">
            {/* Document Header */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <div className="report-header-row">
                <h2 style={{ marginBottom: 'var(--space-2)', color: 'var(--color-sage)' }}>
                  Contract Analysis Report
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <Link
                    to="/upload"
                    className="no-print btn btn-secondary btn-sm"
                    style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                    id="report-header-new-btn"
                  >
                    + Analyse new contract
                  </Link>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: 'var(--color-sage-faint)',
                      color: 'var(--color-sage)',
                      border: '1px solid var(--color-border)',
                      fontWeight: 600,
                    }}
                  >
                    {currentLang === 'Hindi' ? 'हिन्दी अनुवाद' : currentLang === 'Telugu' ? 'తెలుగు అనువాదం' : 'Plain-Language Review'}
                  </span>
                </div>
              </div>
              <p style={{ maxWidth: '100%', fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                Generated {new Date(activeReport.generatedAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })} • Freelancer Agreement Review • Not formal legal advice
              </p>
            </div>

            {/* Summary card */}
            <Section title="Summary" icon="📋">
              <p style={{ maxWidth: '100%', lineHeight: 1.75 }}>{activeReport.summary}</p>
            </Section>

            {/* Plain language */}
            <Section title="What it actually says" icon="📖">
              <div
                style={{ lineHeight: 1.85, maxWidth: '100%' }}
                dangerouslySetInnerHTML={{ __html: activeReport.plainLanguage.replace(/\n/g, '<br/>') }}
              />
            </Section>

            {/* Risks */}
            <Section title="Risk flags" icon="⚠️">
              {activeReport.risks.length === 0 ? (
                <p style={{ maxWidth: '100%' }}>No significant risks identified.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {activeReport.risks.map((risk: RiskItem, i: number) => (
                    <RiskCard key={i} risk={risk} />
                  ))}
                </div>
              )}
            </Section>

            {/* Missing clauses */}
            <Section title="What's missing" icon="🔍">
              {activeReport.missing.length === 0 ? (
                <p style={{ maxWidth: '100%' }}>No missing clauses identified.</p>
              ) : (
                <ul style={{ paddingLeft: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {activeReport.missing.map((item, i) => (
                    <li key={i} style={{ color: 'var(--color-ink-soft)', lineHeight: 1.65 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Obligations */}
            <Section title="Who owes what" icon="⚖️">
              <div className="obligations-grid">
                <ObligationList title="You owe" items={activeReport.obligations.yours} />
                <ObligationList title="Client owes" items={activeReport.obligations.clients} />
              </div>
            </Section>

            {/* Lawyer questions */}
            <Section title="Questions for your lawyer" icon="💬">
              <p style={{ marginBottom: 'var(--space-4)', maxWidth: '100%', fontSize: '0.9rem' }}>
                If this contract warrants legal review, bring these specific questions to your consultation:
              </p>
              <ol style={{ paddingLeft: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {activeReport.lawyerQuestions.map((q, i) => (
                  <li key={i} style={{ color: 'var(--color-ink-soft)', lineHeight: 1.65 }}>
                    {q}
                  </li>
                ))}
              </ol>
            </Section>

            {/* Clean footer for printed PDF */}
            <div
              style={{
                marginTop: 'var(--space-8)',
                paddingTop: 'var(--space-4)',
                borderTop: '1px solid var(--color-border)',
                fontSize: '0.8rem',
                color: 'var(--color-muted)',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>Sift • Contract Clarity for Freelancers</span>
              <span>Confidential & Prepared for Personal Review</span>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════
              INTERACTIVE CONTRACT Q&A ASSISTANT (no-print)
              ════════════════════════════════════════════════════════════ */}
          <div
            id="report-ask-section"
            className="no-print card"
            style={{
              marginTop: 'var(--space-12)',
              backgroundColor: 'var(--color-white)',
              border: '1.5px solid var(--color-sage)',
              padding: 'var(--space-8)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: '1.5rem' }}>💬</span>
              <h3 style={{ margin: 0 }}>Ask Questions Further</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-soft)', marginBottom: 'var(--space-6)', maxWidth: '100%' }}>
              Have specific doubts about penalties, IP transfer, or working with other clients? Ask Sift's AI assistant with full contract context.
            </p>

            {/* Quick question suggestion chips */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-muted)', display: 'block', marginBottom: 'var(--space-2)' }}>
                Suggested questions:
              </span>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {quickQuestions.map((qText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAskSubmit(undefined, qText)}
                    disabled={asking}
                    style={{
                      backgroundColor: 'var(--color-sage-faint)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-sage)',
                      borderRadius: 'var(--radius-pill)',
                      padding: '5px 12px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    + {qText}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat turn history */}
            {chatHistory.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-4)',
                  marginBottom: 'var(--space-6)',
                  maxHeight: 380,
                  overflowY: 'auto',
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      backgroundColor: msg.role === 'user' ? 'var(--color-sage)' : 'var(--color-white)',
                      color: msg.role === 'user' ? 'var(--color-white)' : 'var(--color-ink)',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      border: msg.role === 'user' ? 'none' : '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: 'var(--space-1)' }}>
                      {msg.role === 'user' ? 'You' : 'Sift AI Assistant'} • {msg.ts}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: 'inherit' }}>
                      {msg.content}
                    </p>
                  </div>
                ))}
                {asking && (
                  <div
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor: 'var(--color-white)',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      fontSize: '0.85rem',
                      color: 'var(--color-muted)',
                    }}
                  >
                    <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    Analyzing contract for your answer…
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            {askError && (
              <div
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: '#FDF2ED',
                  border: '1px solid #E8B4A2',
                  borderRadius: 'var(--radius-md)',
                  color: '#8A2C0A',
                  fontSize: '0.85rem',
                  marginBottom: 'var(--space-4)',
                }}
              >
                ⚠️ {askError}
              </div>
            )}

            {/* Input form */}
            <form onSubmit={handleAskSubmit} className="ask-form">
              <input
                type="text"
                className="input"
                placeholder="Ask any question about this contract…"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={asking}
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={asking || !question.trim()}
                style={{ whiteSpace: 'nowrap' }}
              >
                {asking ? 'Thinking…' : 'Ask Sift →'}
              </button>
            </form>
          </div>

          {/* Disclaimer + Bottom Actions (no-print) */}
          <div
            id="report-actions-card"
            className="no-print card card-sand"
            style={{
              marginTop: 'var(--space-8)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
            }}
          >
            <p style={{ fontSize: '0.875rem', maxWidth: '100%', color: 'var(--color-ink-soft)' }}>
              <strong>Not legal advice.</strong> Sift helps you understand contracts faster, but it doesn't replace a qualified lawyer for high-stakes agreements.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link to="/upload" className="btn btn-primary btn-sm" id="report-analyse-another-btn">
                + Analyse another contract
              </Link>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                id="report-print-btn"
                onClick={handlePrintPDF}
              >
                Save PDF
              </button>
              <Link
                to="/"
                className="btn btn-ghost btn-sm"
                id="report-home-btn-bottom"
              >
                ← Back to home
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

/* ── Sub-components ───────────────────────────────────────── */

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon: string
  children: React.ReactNode
}) {
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
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
          marginBottom: 'var(--space-3)',
        }}
      >
        <p style={{ fontWeight: 500, color: 'var(--color-ink)', margin: 0, maxWidth: '100%' }}>
          {risk.clause}
        </p>
        <RiskBadge severity={risk.severity} />
      </div>
      <p style={{ fontSize: '0.9375rem', maxWidth: '100%', lineHeight: 1.7, margin: 0 }}>
        {risk.explanation}
      </p>
    </div>
  )
}

function ObligationList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="card card-sage" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <h4 style={{ fontFamily: 'var(--font-body)' }}>{title}</h4>
      <ul style={{ paddingLeft: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {items.map((item, i) => (
          <li key={i} style={{ color: 'var(--color-ink-soft)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="page-shell">
      <Nav step={3} />
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 'var(--space-5)',
        }}
      >
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
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 'var(--space-5)',
          padding: 'var(--space-12)',
        }}
      >
        <span style={{ fontSize: '2.5rem' }}>⚠️</span>
        <h3>Couldn't load report</h3>
        <p style={{ textAlign: 'center', maxWidth: '40ch' }}>{message}</p>
        <Link to="/upload" className="btn btn-primary">
          Try again
        </Link>
      </main>
    </div>
  )
}
