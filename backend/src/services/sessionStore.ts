import { FieldValue } from 'firebase-admin/firestore'
import { db } from './firebase'
import { ContractSession } from '../models/contract'

// In-memory fallback map for when Firestore is not yet activated or has permission issues
const memoryStore = new Map<string, Partial<ContractSession>>()
let firestoreDisabled = false

export async function saveNewSession(session: {
  sessionId: string
  extractedText: string
  contractType: string
}): Promise<void> {
  // Always store in memory cache
  const now = new Date()
  memoryStore.set(session.sessionId, {
    ...session,
    createdAt: now as any,
    updatedAt: now as any,
  })

  if (firestoreDisabled) return

  try {
    const sessionRef = db.collection('sessions').doc(session.sessionId)
    await sessionRef.set({
      ...session,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  } catch (err: any) {
    if (err?.code === 7 || err?.message?.includes('Cloud Firestore API')) {
      firestoreDisabled = true
      console.warn('?? Cloud Firestore API is disabled in project. Using resilient in-memory session store.')
    } else {
      console.warn('?? Firestore write error, falling back to memory store:', err?.message)
    }
  }
}

export async function getSession(sessionId: string): Promise<Partial<ContractSession> | null> {
  if (!firestoreDisabled) {
    try {
      const snap = await db.collection('sessions').doc(sessionId).get()
      if (snap.exists) {
        return snap.data() as ContractSession
      }
    } catch (err: any) {
      if (err?.code === 7 || err?.message?.includes('Cloud Firestore API')) {
        firestoreDisabled = true
        console.warn('?? Cloud Firestore API disabled. Reading from memory store.')
      }
    }
  }

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
    updatedAt: new Date() as any,
  })

  if (firestoreDisabled) return

  try {
    const sessionRef = db.collection('sessions').doc(sessionId)
    await sessionRef.update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    })
  } catch (err: any) {
    if (err?.code === 7 || err?.message?.includes('Cloud Firestore API')) {
      firestoreDisabled = true
    } else {
      console.warn('?? Firestore update error, falling back to memory store:', err?.message)
    }
  }
}
