import { Request, Response, NextFunction } from 'express'
import admin from '../services/firebase'

/**
 * Optional auth middleware — attach to routes that require a logged-in user.
 * The owner (you) can gate routes behind this.
 */
export async function authenticate(
  req: Request & { uid?: string },
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header.' })
    return
  }

  const idToken = authHeader.slice(7)
  try {
    const decoded = await admin.auth().verifyIdToken(idToken)
    req.uid = decoded.uid
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' })
  }
}
