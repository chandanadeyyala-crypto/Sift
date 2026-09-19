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

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace escaped newlines that come from .env strings
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export default admin
export const db = admin.firestore()
