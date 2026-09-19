import { useEffect, useState } from 'react'
import { getReport, ReportResponse } from '@/lib/api'

interface UseReportResult {
  report: ReportResponse | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useReport(sessionId: string | undefined): UseReportResult {
  const [report, setReport]   = useState<ReportResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [tick, setTick]       = useState(0)

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    getReport(sessionId)
      .then(setReport)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load report.')
      )
      .finally(() => setLoading(false))
  }, [sessionId, tick])

  return {
    report,
    loading,
    error,
    refetch: () => setTick((t) => t + 1),
  }
}
