import { FieldValue } from 'firebase-admin/firestore'
import { db } from './firebase'
import { ContractSession } from '../models/contract'

// In-memory fallback map for when Firestore is not yet activated or has permission issues
const memoryStore = new Map<string, Partial<ContractSession>>()
let firestoreDisabled = process.env.NODE_ENV === 'test' || !process.env.FIREBASE_PRIVATE_KEY

type FirebaseError = Error & { code?: number | string }

/**
 * Resets the in-memory cache. Used in tests to simulate process recycling / restarts.
 */
export function clearMemoryStoreForTesting(): void {
  memoryStore.clear()
}

/**
 * Allows tests to force-enable or force-disable Firestore simulation.
 */
export function setFirestoreDisabledForTesting(disabled: boolean): void {
  firestoreDisabled = disabled
}

function isFirestoreUnavailable(error: FirebaseError): boolean {
  return (
    error?.code === 5 ||
    error?.code === 7 ||
    error?.code === 'NOT_FOUND' ||
    error?.code === 'PERMISSION_DENIED' ||
    Boolean(error?.message?.includes('Cloud Firestore API')) ||
    Boolean(error?.message?.includes('NOT_FOUND'))
  )
}

export async function saveNewSession(session: {
  sessionId: string
  extractedText: string
  contractType: string
}): Promise<void> {
  const now = FieldValue.serverTimestamp()
  // Store in memory cache for immediate access
  memoryStore.set(session.sessionId, {
    ...session,
    createdAt: now as unknown as FirebaseFirestore.Timestamp,
    updatedAt: now as unknown as FirebaseFirestore.Timestamp,
  })

  if (firestoreDisabled) return

  try {
    const sessionRef = db.collection('sessions').doc(session.sessionId)
    await sessionRef.set({
      ...session,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  } catch (err: unknown) {
    const error = err as FirebaseError
    if (isFirestoreUnavailable(error)) {
      firestoreDisabled = true
      console.warn('⚠️ Cloud Firestore Database unavailable or not found. Falling back to resilient in-memory store.')
    } else {
      console.error('[sessionStore] Firestore write error for sessionId', session.sessionId, error)
    }
  }
}

export async function getSession(sessionId: string): Promise<Partial<ContractSession> | null> {
  // 1. Try reading from persistent Firestore first
  if (!firestoreDisabled) {
    try {
      const snap = await db.collection('sessions').doc(sessionId).get()
      if (snap.exists) {
        const data = snap.data() as ContractSession
        // Warm up memory store with fresh persistent data
        memoryStore.set(sessionId, data)
        return data
      }
    } catch (err: unknown) {
      const error = err as FirebaseError
      if (isFirestoreUnavailable(error)) {
        firestoreDisabled = true
        console.warn('⚠️ Cloud Firestore Database unavailable. Reading from resilient in-memory store.')
      } else {
        console.error('[sessionStore] Firestore getSession error for sessionId:', sessionId, error)
      }
    }
  }

  // 2. Fall back to memory store
  return memoryStore.get(sessionId) || null
}

export async function updateSession(
  sessionId: string,
  data: Partial<ContractSession>
): Promise<void> {
  const existing = memoryStore.get(sessionId) || {}
  memoryStore.set(sessionId, {
    ...existing,
    ...data,
    updatedAt: FieldValue.serverTimestamp() as unknown as FirebaseFirestore.Timestamp,
  })

  if (firestoreDisabled) return

  try {
    const sessionRef = db.collection('sessions').doc(sessionId)
    // Use set with merge: true so it doesn't fail if the doc was somehow omitted
    await sessionRef.set({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })
  } catch (err: unknown) {
    const error = err as FirebaseError
    if (isFirestoreUnavailable(error)) {
      firestoreDisabled = true
    } else {
      console.error('[sessionStore] Firestore update error for sessionId:', sessionId, error)
    }
  }
}
