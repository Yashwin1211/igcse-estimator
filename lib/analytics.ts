import { getOrCreateSessionId } from '@/lib/utils/session'

export function trackEvent(type: string, data?: Record<string, unknown>) {
  try {
    const sessionId = getOrCreateSessionId()
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: type, event_data: data, session_id: sessionId }),
    }).catch(() => {}) // fire and forget
  } catch {
    // never throw — analytics must never break the app
  }
}
