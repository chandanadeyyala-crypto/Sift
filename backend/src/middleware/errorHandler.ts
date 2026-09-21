import { Request, Response, NextFunction } from 'express'

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[error]', err)
  const status = (err as Error & { status?: number }).status ?? 500
  
  // Sanitize message for 500s in production
  const isProd = process.env.NODE_ENV === 'production'
  const safeMessage = (isProd && status === 500) 
    ? 'Internal server error' 
    : (err.message || 'Internal server error')

  res.status(status).json({
    error: safeMessage,
  })
}
