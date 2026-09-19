import { useState, useCallback } from 'react'
import { uploadContract, UploadResponse } from '@/lib/api'

interface UseUploadResult {
  upload: (file: File) => Promise<UploadResponse>
  loading: boolean
  error: string | null
  reset: () => void
}

export function useUpload(): UseUploadResult {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const upload = useCallback(async (file: File): Promise<UploadResponse> => {
    setLoading(true)
    setError(null)
    try {
      const result = await uploadContract(file)
      return result
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed.'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setError(null)
    setLoading(false)
  }, [])

  return { upload, loading, error, reset }
}
