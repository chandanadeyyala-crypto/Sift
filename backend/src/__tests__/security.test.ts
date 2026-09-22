import request from 'supertest'
import app from '../index'
import { validateFileMagicBytes } from '../middleware/fileValidator'

// ─────────────────────────────────────────────────────────────────────────────
// File Validator — unit tests for magic byte checks
// ─────────────────────────────────────────────────────────────────────────────
describe('validateFileMagicBytes', () => {
  it('accepts a valid PDF buffer', () => {
    const buf = Buffer.from('%PDF-1.4 rest of file...')
    expect(validateFileMagicBytes(buf, 'application/pdf')).toBe(true)
  })

  it('rejects a fake PDF (JS file renamed to PDF)', () => {
    const buf = Buffer.from('console.log("hack")')
    expect(validateFileMagicBytes(buf, 'application/pdf')).toBe(false)
  })

  it('accepts a valid JPEG buffer', () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00])
    expect(validateFileMagicBytes(buf, 'image/jpeg')).toBe(true)
  })

  it('rejects a fake JPEG (text content with wrong magic bytes)', () => {
    const buf = Buffer.from('Not a JPEG image')
    expect(validateFileMagicBytes(buf, 'image/jpeg')).toBe(false)
  })

  it('accepts a valid PNG buffer', () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])
    expect(validateFileMagicBytes(buf, 'image/png')).toBe(true)
  })

  it('rejects a fake PNG', () => {
    const buf = Buffer.from('GIF89a fake png content')
    expect(validateFileMagicBytes(buf, 'image/png')).toBe(false)
  })

  it('accepts a valid WebP buffer', () => {
    const buf = Buffer.alloc(12)
    buf.write('RIFF', 0, 'ascii')
    buf.writeUInt32LE(0, 4) // file size placeholder
    buf.write('WEBP', 8, 'ascii')
    expect(validateFileMagicBytes(buf, 'image/webp')).toBe(true)
  })

  it('rejects a fake WebP', () => {
    const buf = Buffer.from('Not a WebP 12345')
    expect(validateFileMagicBytes(buf, 'image/webp')).toBe(false)
  })

  it('accepts a valid plain text buffer', () => {
    const buf = Buffer.from('This is a plain text contract document.')
    expect(validateFileMagicBytes(buf, 'text/plain')).toBe(true)
  })

  it('rejects a binary file passed as text/plain (contains null bytes)', () => {
    const buf = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04])
    expect(validateFileMagicBytes(buf, 'text/plain')).toBe(false)
  })

  it('rejects an empty buffer for all types', () => {
    const empty = Buffer.alloc(0)
    expect(validateFileMagicBytes(empty, 'application/pdf')).toBe(false)
    expect(validateFileMagicBytes(empty, 'image/jpeg')).toBe(false)
    expect(validateFileMagicBytes(empty, 'text/plain')).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Server-side file validation integration tests
// ─────────────────────────────────────────────────────────────────────────────
describe('File Upload Server-Side Validation', () => {
  it('returns 415 for unsupported MIME type', async () => {
    const res = await request(app)
      .post('/api/contracts/upload')
      .attach('contract', Buffer.from('console.log("x")'), {
        filename: 'test.js',
        contentType: 'application/javascript',
      })
    expect(res.status).toBe(415)
    expect(res.body.error).toContain('Unsupported file type')
  })

  it('returns 415 when a file is declared as text/plain but contains binary null bytes (MIME spoofing)', async () => {
    const binaryBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]) // MZ header (EXE)
    const res = await request(app)
      .post('/api/contracts/upload')
      .attach('contract', binaryBuffer, {
        filename: 'contract.txt',
        contentType: 'text/plain',
      })
    expect(res.status).toBe(415)
    expect(res.body.error).toContain('does not match declared type')
  })

  it('returns 415 when a file is declared as application/pdf but has wrong magic bytes', async () => {
    const fakeBuffer = Buffer.from('This is NOT a PDF, it is plain text.')
    const res = await request(app)
      .post('/api/contracts/upload')
      .attach('contract', fakeBuffer, {
        filename: 'fake.pdf',
        contentType: 'application/pdf',
      })
    expect(res.status).toBe(415)
    expect(res.body.error).toContain('does not match declared type')
  })

  it('accepts a valid plain text file', async () => {
    // This will hit the AI extraction step which is mocked in test environment
    // We just verify it passes the validation layer (200 or 422 if AI not available)
    const res = await request(app)
      .post('/api/contracts/upload')
      .attach('contract', Buffer.from('This is a standard freelance contract agreement.'), {
        filename: 'contract.txt',
        contentType: 'text/plain',
      })
    // Either succeeds (200) or fails at AI step (422) but NOT at validation (400/415)
    expect(res.status).not.toBe(415)
    expect(res.status).not.toBe(400)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Session ownership enforcement
// ─────────────────────────────────────────────────────────────────────────────
describe('Session Ownership Enforcement', () => {
  it('returns 404 (not 403) for anonymous session accessed by anyone — anonymous sessions are intentionally public by sessionId', async () => {
    // Anonymous session was created, someone requests analyze with it
    const res = await request(app)
      .post('/api/contracts/analyze')
      .send({ sessionId: 'non-existent-session-abc', answers: {} })
    // Session doesn't exist → 404 (not a 403 ownership error)
    expect(res.status).toBe(404)
  })
})
