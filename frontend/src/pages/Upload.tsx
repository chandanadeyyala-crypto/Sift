import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Nav from '@/components/Nav'
import { uploadContract } from '@/lib/api'

type FileState = { file: File; preview: string } | null

export default function Upload() {
  const [fileState, setFileState]   = useState<FileState>(null)
  const [dragOver, setDragOver]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const inputRef                    = useRef<HTMLInputElement>(null)
  const navigate                    = useNavigate()

  const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain']

  function handleFile(f: File) {
    setError(null)
    if (!ACCEPTED.includes(f.type)) {
      setError('Please upload a PDF, image (JPG/PNG/WebP), or plain-text file.')
      return
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('File must be under 20 MB.')
      return
    }
    const preview = f.type.startsWith('image/') ? URL.createObjectURL(f) : ''
    setFileState({ file: f, preview })
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  async function handleSubmit() {
    if (!fileState) return
    setLoading(true)
    setError(null)
    try {
      const { sessionId } = await uploadContract(fileState.file)
      navigate(`/questions/${sessionId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell">
      <Nav step={1} />

      <main style={{ flex: 1, padding: 'var(--space-12) var(--space-6)' }}>
        <div className="content-center fade-up">

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
            <div className="step-bar">
              <div className="step-dot active" />
              <div className="step-dot" />
              <div className="step-dot" />
            </div>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>Step 1 of 3 — Upload contract</span>
          </div>

          <h2 style={{ marginBottom: 'var(--space-3)' }}>Upload your contract</h2>
          <p style={{ marginBottom: 'var(--space-8)' }}>
            PDF, image (JPG/PNG/WebP), or plain text. Max 20 MB.
            We never share your documents.
          </p>

          {/* Drop zone */}
          <div
            className={`upload-zone${dragOver ? ' drag-over' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            role="button"
            tabIndex={0}
            aria-label="Click or drag to upload your contract"
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.txt"
              onChange={onInputChange}
              id="contract-file-input"
            />

            {fileState?.preview ? (
              <img
                src={fileState.preview}
                alt="Contract preview"
                style={{ maxHeight: 200, borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}
              />
            ) : (
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)', lineHeight: 1 }}>📄</div>
            )}

            {fileState ? (
              <>
                <p style={{ fontWeight: 500, color: 'var(--color-ink)', maxWidth: '100%', wordBreak: 'break-all' }}>
                  {fileState.file.name}
                </p>
                <p style={{ fontSize: '0.875rem', marginTop: 'var(--space-1)' }}>
                  {(fileState.file.size / 1024).toFixed(0)} KB · click to replace
                </p>
              </>
            ) : (
              <>
                <p style={{ fontWeight: 500, color: 'var(--color-ink)', maxWidth: '100%' }}>
                  Drop your contract here, or <span style={{ color: 'var(--color-sage)', textDecoration: 'underline' }}>browse</span>
                </p>
                <p style={{ fontSize: '0.875rem', marginTop: 'var(--space-2)' }}>
                  PDF · JPG · PNG · WebP · TXT
                </p>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginTop: 'var(--space-4)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-risk-high)',
              color: 'var(--color-risk-high)',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Submit & Reset actions */}
          <div style={{
            marginTop: 'var(--space-8)',
            display: 'flex',
            justifyContent: fileState ? 'space-between' : 'flex-end',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
          }}>
            {fileState && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setFileState(null)
                  setError(null)
                  if (inputRef.current) inputRef.current.value = ''
                }}
                disabled={loading}
              >
                ✕ Remove & choose another
              </button>
            )}

            <button
              id="upload-submit-btn"
              className="btn btn-primary btn-lg"
              disabled={!fileState || loading}
              onClick={handleSubmit}
              style={{ minWidth: 160 }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18 }} />
                  Reading contract…
                </>
              ) : (
                'Continue →'
              )}
            </button>
          </div>

          <div style={{
            marginTop: 'var(--space-8)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            fontSize: '0.8125rem',
            color: 'var(--color-muted)',
          }}>
            <span>🔒 Processed server-side and deleted after analysis.</span>
            <a href="/report/sample" style={{ color: 'var(--color-sage)', fontWeight: 500 }}>
              Want to see an example? View sample report →
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
