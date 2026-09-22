import { Request, Response, NextFunction } from 'express'
import multer from 'multer'

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
])

export const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.txt',
])

/**
 * Validates file buffer magic bytes/signatures to prevent MIME spoofing.
 */
export function validateFileMagicBytes(buffer: Buffer, declaredMimeType: string): boolean {
  if (buffer.length === 0) return false

  if (declaredMimeType === 'application/pdf') {
    // PDF starts with %PDF- (0x25 0x50 0x44 0x46 0x2D)
    return buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-'
  }

  if (declaredMimeType === 'image/png') {
    // PNG starts with 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    )
  }

  if (declaredMimeType === 'image/jpeg') {
    // JPEG starts with 0xFF 0xD8 0xFF
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    )
  }

  if (declaredMimeType === 'image/webp') {
    // WebP has 'RIFF' at 0..3 and 'WEBP' at 8..11
    if (buffer.length < 12) return false
    const riff = buffer.subarray(0, 4).toString('ascii')
    const webp = buffer.subarray(8, 12).toString('ascii')
    return riff === 'RIFF' && webp === 'WEBP'
  }

  if (declaredMimeType === 'text/plain') {
    // Plain text should not contain binary null bytes in the first 1KB
    const sample = buffer.subarray(0, Math.min(1024, buffer.length))
    return !sample.includes(0x00)
  }

  return false
}

// Multer configured with memoryStorage and strict 20MB limit
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Use PDF, JPG, PNG, WebP, or TXT.`))
    }
  },
})

/**
 * Express middleware that wraps multer upload and performs strict server-side validation:
 * 1. Enforces 20MB size limit (returns HTTP 413)
 * 2. Enforces allowed MIME types (returns HTTP 415)
 * 3. Enforces file signature / magic-byte verification (returns HTTP 415)
 */
export function fileValidator(req: Request, res: Response, next: NextFunction): void {
  uploadMiddleware.single('contract')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large. Maximum size is 20MB.' })
      }
      return res.status(415).json({ error: err.message })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' })
    }

    // Verify file size server-side
    if (req.file.size > MAX_FILE_SIZE_BYTES || req.file.buffer.length > MAX_FILE_SIZE_BYTES) {
      return res.status(413).json({ error: 'File too large. Maximum size is 20MB.' })
    }

    // Verify MIME type
    if (!ALLOWED_MIME_TYPES.has(req.file.mimetype)) {
      return res.status(415).json({
        error: `Unsupported file type: ${req.file.mimetype}. Use PDF, JPG, PNG, WebP, or TXT.`,
      })
    }

    // Verify magic bytes / file signature to prevent MIME spoofing
    const isValidSignature = validateFileMagicBytes(req.file.buffer, req.file.mimetype)
    if (!isValidSignature) {
      return res.status(415).json({
        error: `File content does not match declared type (${req.file.mimetype}). Please upload a valid document or plain text file.`,
      })
    }

    next()
  })
}
