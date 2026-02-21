import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { SaveEstimatePayload } from '@/types'

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

// GET — fetch saved estimates for current user or guest session
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('session_id')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('saved_estimates')
    .select(`
      id, label, created_at, result,
      estimate_entries (
        id, subject_id, tier_selected, paper_marks,
        subjects ( syllabus_code, name )
      )
    `)
    .order('created_at', { ascending: false })

  if (user) {
    query = query.eq('user_id', user.id)
  } else if (sessionId) {
    query = query.eq('session_id', sessionId).is('user_id', null)
  } else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST — save a new estimate
export async function POST(req: Request) {
  let body: SaveEstimatePayload

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Create the parent estimate record
  const { data: estimate, error: estimateError } = await supabase
    .from('saved_estimates')
    .insert({
      user_id: user?.id ?? null,
      session_id: user ? null : (body.session_id ?? null),
      label: body.label ?? null,
      result: body.result,
    })
    .select('id')
    .single()

  if (estimateError || !estimate) {
    const msg = estimateError?.message ?? 'Insert failed'
    await logError('/api/estimates', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // Insert entries
  if (body.entries && body.entries.length > 0) {
    const { error: entriesError } = await supabase.from('estimate_entries').insert(
      body.entries.map((e) => ({
        estimate_id: estimate.id,
        subject_id: e.subject_id,
        tier_selected: e.tier_selected,
        paper_marks: e.paper_marks,
      }))
    )

    if (entriesError) {
      // Roll back the estimate header
      await supabase.from('saved_estimates').delete().eq('id', estimate.id)
      await logError('/api/estimates', entriesError.message)
      return NextResponse.json({ error: entriesError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ id: estimate.id }, { status: 201 })
}
