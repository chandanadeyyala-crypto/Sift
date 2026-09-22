import { Request, Response, NextFunction } from 'express'

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[error]', err)
  const status = (err as Error & { status?: number }).status ?? 500

  // In production, sanitize 500-level errors to prevent leaking internal stack
  // details or file paths. Client-facing 4xx errors still show their message.
  const isProd = process.env.NODE_ENV === 'production'
  const safeMessage = (isProd && status >= 500)
    ? 'Internal server error'
    : (err.message || 'Internal server error')

  res.status(status).json({
    error: safeMessage,
  })
}
