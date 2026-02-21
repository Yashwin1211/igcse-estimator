import { NextResponse } from 'next/server'
import { calculateEstimate } from '@/lib/calculation/calculate'
import { createServiceClient } from '@/lib/supabase/server'
import type { CalculatePayload } from '@/types'

async function logError(route: string, message: string) {
  try {
    const supabase = await createServiceClient()
    await supabase.from('analytics_events').insert({
      event_type: 'error',
      event_data: { route, message },
    })
  } catch {
    // analytics must never break the app
  }
}

export async function POST(req: Request) {
  let body: CalculatePayload

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.entries || !Array.isArray(body.entries) || body.entries.length === 0) {
    return NextResponse.json({ error: 'entries array is required' }, { status: 400 })
  }

  if (body.entries.length > 20) {
    return NextResponse.json({ error: 'Maximum 20 subjects per estimate' }, { status: 400 })
  }

  try {
    const result = await calculateEstimate(body.entries, body.season ?? 'MJ')
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Calculation failed'
    console.error('[calculate]', err)
    await logError('/api/estimate/calculate', message)
    return NextResponse.json({ error: 'Calculation failed' }, { status: 500 })
  }
}
