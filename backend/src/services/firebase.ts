// ─────────────────────────────────────────────────────────────
// Firebase Admin SDK Initialization
//
// HOW TO ADD YOUR KEYS:
//   1. Copy backend/.env.example → backend/.env
//   2. In Firebase Console → Project Settings → Service Accounts
//      → Generate new private key → download the JSON file.
//   3. Copy these values from the JSON into your .env:
//        FIREBASE_PROJECT_ID     → "project_id"
//        FIREBASE_CLIENT_EMAIL   → "client_email"
//        FIREBASE_PRIVATE_KEY    → "private_key"  (keep quotes + literal \n)
// ─────────────────────────────────────────────────────────────

import admin from 'firebase-admin'

function formatPrivateKey(key?: string): string | undefined {
  if (!key) return undefined
  let formatted = key.replace(/\\n/g, '\n')
  // If Render stripped all newlines, extract the body and reconstruct it
  if (!formatted.includes('\n') && formatted.includes('BEGIN PRIVATE KEY')) {
    const match = formatted.match(/-----BEGIN PRIVATE KEY-----(.*)-----END PRIVATE KEY-----/)
    if (match) {
      const body = match[1].replace(/\s+/g, '')
      formatted = `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----`
    }
  }
  return formatted
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    }),
  })
}

export default admin
export const db = admin.firestore()
