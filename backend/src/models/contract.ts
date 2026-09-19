// ─────────────────────────────────────────────────────────────
// Contract data models / TypeScript interfaces
// ─────────────────────────────────────────────────────────────

export type Severity = 'high' | 'medium' | 'low' | 'info'

export interface RiskItem {
  clause: string
  severity: Severity
  explanation: string
}

export interface Obligations {
  yours: string[]
  clients: string[]
}

/**
 * The structured JSON that the AI must return.
 * This shape is referenced in the analysis prompt.
 */
export interface ContractAnalysis {
  summary: string
  plainLanguage: string
  risks: RiskItem[]
  missing: string[]
  obligations: Obligations
  lawyerQuestions: string[]
}

/**
 * A session stored in Firestore while the user is
 * working through the upload → questions → report flow.
 */
export interface ContractSession {
  sessionId: string
  extractedText: string
  contractType: string
  userAnswers?: Record<string, string>
  analysis?: ContractAnalysis
  createdAt: FirebaseFirestore.Timestamp
  updatedAt: FirebaseFirestore.Timestamp
}
