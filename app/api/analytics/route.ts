import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const VALID_EVENT_TYPES = new Set([
  'page_view',
  'estimate_calculated',
  'estimate_saved',
  'user_signed_up',
  'error',
  'estimate_deleted',
])

export async function POST(req: Request) {
  let body: {
    event_type?: string
    event_data?: Record<string, unknown>
    session_id?: string
    user_id?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.event_type || !VALID_EVENT_TYPES.has(body.event_type)) {
    return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 })
  }

  try {
    const supabase = await createServiceClient()
    await supabase.from('analytics_events').insert({
      event_type: body.event_type,
      event_data: body.event_data ?? null,
      session_id: body.session_id ?? null,
      user_id: body.user_id ?? null,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[analytics]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
