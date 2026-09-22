// ─────────────────────────────────────────────────────────────
// API Client — thin wrapper around fetch for backend calls
// Base URL resolves to the Vite dev proxy (/api → localhost:4000)
// ─────────────────────────────────────────────────────────────

import { auth } from './firebase'
import { getIdToken } from 'firebase/auth'

const BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api'

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Attach Firebase ID token if user is authenticated, so the backend can bind
  // session ownership to the requesting user's UID. Anonymous usage still works
  // seamlessly — the token is simply omitted when no user is signed in.
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> ?? {}),
  }
  const currentUser = auth.currentUser
  if (currentUser) {
    try {
      const token = await getIdToken(currentUser, /* forceRefresh */ false)
      headers['Authorization'] = `Bearer ${token}`
    } catch {
      // If token retrieval fails, proceed as anonymous (non-blocking)
    }
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const body = await res.text()
    try {
      const parsed = JSON.parse(body)
      throw new Error(parsed.error || parsed.message || body)
    } catch (e) {
      if (e instanceof Error && e.message && e.message !== body && !e.message.startsWith('Unexpected token')) throw e
      throw new Error(body || `HTTP ${res.status}`)
    }
  }

  return res.json() as Promise<T>
}

// ── Contract endpoints ─────────────────────────────────────

export interface UploadResponse {
  sessionId: string
  contractType: string
  extractedText: string
}

export interface QuestionPayload {
  sessionId: string
  answers: Record<string, string>
}

export interface ReportResponse {
  sessionId: string
  summary: string
  plainLanguage: string
  risks: RiskItem[]
  missing: string[]
  obligations: {
    yours: string[]
    clients: string[]
  }
  lawyerQuestions: string[]
  generatedAt: string
}

export interface RiskItem {
  clause: string
  severity: 'high' | 'medium' | 'low' | 'info'
  explanation: string
}

export function uploadContract(file: File): Promise<UploadResponse> {
  const form = new FormData()
  form.append('contract', file)
  return request<UploadResponse>('/contracts/upload', {
    method: 'POST',
    body: form,
  })
}

export function submitAnswers(payload: QuestionPayload): Promise<ReportResponse> {
  return request<ReportResponse>('/contracts/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function getReport(sessionId: string): Promise<ReportResponse> {
  return request<ReportResponse>(`/contracts/report/${sessionId}`)
}

export interface AskQuestionPayload {
  sessionId: string
  question: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
}

export interface AskQuestionResponse {
  answer: string
  question: string
}

export function askQuestion(payload: AskQuestionPayload): Promise<AskQuestionResponse> {
  return request<AskQuestionResponse>('/contracts/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export interface TranslatePayload {
  sessionId: string
  targetLanguage: 'Hindi' | 'Telugu'
}

export function translateReport(payload: TranslatePayload): Promise<ReportResponse & { targetLanguage: string }> {
  return request<ReportResponse & { targetLanguage: string }>('/contracts/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

