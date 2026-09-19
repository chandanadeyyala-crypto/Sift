// ─────────────────────────────────────────────────────────────
// API Client — thin wrapper around fetch for backend calls
// Base URL resolves to the Vite dev proxy (/api → localhost:4000)
// ─────────────────────────────────────────────────────────────

const BASE = '/api'

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      ...(options.headers ?? {}),
    },
    ...options,
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(body || `HTTP ${res.status}`)
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
