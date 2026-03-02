/**
 * Turns API/axios errors into short, user-friendly messages so users can identify what went wrong.
 */
export function getErrorMessage(err: unknown): string {
  if (err == null) return 'Something went wrong. Please try again.'

  // Axios error with response (never show "Request failed with status code 400")
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const res = (err as { response?: { data?: unknown; status?: number } }).response
    if (res?.data != null) {
      const data = res.data as Record<string, unknown>

      // Custom API format: { success: false, error: { code, message } }
      const apiError = data.error && typeof data.error === 'object' && data.error !== null ? (data.error as Record<string, unknown>) : null
      const msg = apiError && 'message' in apiError ? apiError.message : null
      if (msg != null) {
        if (typeof msg === 'string' && msg.length > 0) return msg
        if (Array.isArray(msg) && msg.length) return msg.map(String).join(' — ')
      }

      // DRF detail string
      if (typeof data.detail === 'string') return data.detail

      // Raw DRF field errors: { email: ["..."], phone: ["..."] }
      const fieldMessages: string[] = []
      for (const [field, messages] of Object.entries(data)) {
        if (field === 'detail' || field === 'error' || field === 'success') continue
        if (Array.isArray(messages) && messages.length) {
          const label = field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
          fieldMessages.push(`${label}: ${messages.join(', ')}`)
        } else if (typeof messages === 'string') {
          const label = field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
          fieldMessages.push(`${label}: ${messages}`)
        }
      }
      if (fieldMessages.length) return fieldMessages.join(' — ')

      // Nested detail (e.g. { detail: { code: "...", message: "..." } })
      if (data.detail && typeof data.detail === 'object' && data.detail !== null && 'message' in data.detail) {
        const m = (data.detail as { message?: string }).message
        if (typeof m === 'string') return m
      }
    }

    // HTTP status-based fallback only when no body message
    const status = res?.status
    if (status === 400) return 'Invalid request. Please check your input and try again.'
    if (status === 401) return 'Session expired or invalid. Please sign in again.'
    if (status === 403) return "You don't have permission to do this."
    if (status === 404) return 'The requested item was not found.'
    if (status === 409) return 'This conflicts with existing data (e.g. duplicate). Please change and try again.'
    if (status && status >= 500) return 'Server error. Please try again in a moment.'
  }

  // Standard Error
  if (err instanceof Error) {
    const msg = err.message?.trim()
    if (msg && !msg.includes('Network Error')) return msg
  }

  // Network / generic
  if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    const m = (err as { message: string }).message
    if (m.toLowerCase().includes('network')) return 'Network error. Check your connection and try again.'
  }

  return 'Something went wrong. Please try again.'
}
