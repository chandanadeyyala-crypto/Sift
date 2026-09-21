import { useState, useEffect } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  async function login(email: string, pass: string) {
    setAuthError(null)
    try {
      await signInWithEmailAndPassword(auth, email, pass)
    } catch (err: unknown) {
      const error = err as Error
      setAuthError(error.message || 'Login failed')
      throw err
    }
  }

  async function signup(email: string, pass: string, displayName?: string) {
    setAuthError(null)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass)
      if (displayName && cred.user) {
        await updateProfile(cred.user, { displayName })
      }
    } catch (err: unknown) {
      const error = err as Error
      setAuthError(error.message || 'Signup failed')
      throw err
    }
  }

  async function loginWithGoogle() {
    setAuthError(null)
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (err: unknown) {
      const error = err as Error
      setAuthError(error.message || 'Google sign-in failed')
      throw err
    }
  }

  async function logout() {
    setAuthError(null)
    try {
      await fbSignOut(auth)
    } catch (err: unknown) {
      const error = err as Error
      setAuthError(error.message || 'Sign out failed')
      throw err
    }
  }

  return {
    user,
    loading,
    authError,
    setAuthError,
    login,
    signup,
    loginWithGoogle,
    logout,
  }
}
