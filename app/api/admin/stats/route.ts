import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { EstimateResult } from '@/types'

const GRADE_ORDER = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'U']

function getLast30Days(): string[] {
  const days: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token || !process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString()

  const [
    { count: userCount },
    { count: estimateCount },
    { data: allEstimatesOwnership },
    { data: estimatesLast30 },
    { data: allEntries },
    { data: calcEvents },
    { data: allSavedEstimates },
    { data: recentEvents },
    { data: pageViewEvents },
    { data: errorLog },
    { count: errorCount },
  ] = await Promise.all([
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('saved_estimates').select('*', { count: 'exact', head: true }),
    supabase.from('saved_estimates').select('user_id'),
    supabase.from('saved_estimates').select('created_at').gte('created_at', thirtyDaysAgoStr),
    supabase.from('estimate_entries').select('subject_id, subjects(name, syllabus_code)'),
    supabase.from('analytics_events').select('event_data').eq('event_type', 'estimate_calculated'),
    supabase.from('saved_estimates').select('result'),
    supabase.from('analytics_events').select('event_type, created_at').gte('created_at', thirtyDaysAgoStr),
    supabase.from('analytics_events').select('event_data').eq('event_type', 'page_view'),
    supabase
      .from('analytics_events')
      .select('created_at, event_data')
      .eq('event_type', 'error')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'error'),
  ])

  // Guest vs registered
  const guestCount = allEstimatesOwnership?.filter((e) => !e.user_id).length ?? 0
  const registeredCount = allEstimatesOwnership?.filter((e) => e.user_id).length ?? 0

  // Estimates by day (last 30 days)
  const days = getLast30Days()
  const estimatesByDayMap: Record<string, number> = {}
  for (const e of estimatesLast30 ?? []) {
    const day = (e.created_at as string).split('T')[0]
    estimatesByDayMap[day] = (estimatesByDayMap[day] ?? 0) + 1
  }
  const estimatesByDay = days.map((d) => ({ day: d, count: estimatesByDayMap[d] ?? 0 }))

  // Most popular subjects
  type SubjectRow = { name: string; syllabus_code: string }
  const subjectCountMap: Record<string, { name: string; code: string; count: number }> = {}
  for (const entry of allEntries ?? []) {
    const id = entry.subject_id as string
    const subjectInfo = entry.subjects as unknown as SubjectRow | null
    if (!subjectCountMap[id]) {
      subjectCountMap[id] = {
        name: subjectInfo?.name ?? id,
        code: subjectInfo?.syllabus_code ?? '',
        count: 0,
      }
    }
    subjectCountMap[id].count++
  }
  const topSubjects = Object.values(subjectCountMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Season breakdown (from estimate_calculated events)
  const seasonBreakdown: Record<string, number> = { FM: 0, MJ: 0, ON: 0 }
  for (const event of calcEvents ?? []) {
    const season = (event.event_data as Record<string, unknown>)?.season as string
    if (season && season in seasonBreakdown) {
      seasonBreakdown[season]++
    }
  }

  // Grade distribution (from saved estimate results)
  const gradeDistributionMap: Record<string, number> = {}
  for (const est of allSavedEstimates ?? []) {
    const result = est.result as EstimateResult
    for (const entry of result?.entries ?? []) {
      const grade = entry.estimated_grade ?? 'U'
      gradeDistributionMap[grade] = (gradeDistributionMap[grade] ?? 0) + 1
    }
  }
  const gradeDistribution = Object.entries(gradeDistributionMap).sort(
    ([a], [b]) => GRADE_ORDER.indexOf(a) - GRADE_ORDER.indexOf(b)
  )

  // Event counts by type and page views by day (last 30 days)
  const eventCountsByType: Record<string, number> = {}
  const pageViewsByDayMap: Record<string, number> = {}
  for (const event of recentEvents ?? []) {
    const type = event.event_type as string
    eventCountsByType[type] = (eventCountsByType[type] ?? 0) + 1
    if (type === 'page_view') {
      const day = (event.created_at as string).split('T')[0]
      pageViewsByDayMap[day] = (pageViewsByDayMap[day] ?? 0) + 1
    }
  }
  const pageViewsByDay = days.map((d) => ({ day: d, count: pageViewsByDayMap[d] ?? 0 }))

  // Total page views (all time)
  const totalPageViews = pageViewEvents?.length ?? 0

  // Page views by path (all time)
  const pageViewsByPath: Record<string, number> = {}
  for (const event of pageViewEvents ?? []) {
    const path =
      ((event.event_data as Record<string, unknown>)?.path as string) ?? 'unknown'
    pageViewsByPath[path] = (pageViewsByPath[path] ?? 0) + 1
  }

  return NextResponse.json({
    userCount: userCount ?? 0,
    estimateCount: estimateCount ?? 0,
    totalPageViews,
    errorCount: errorCount ?? 0,
    guestCount,
    registeredCount,
    estimatesByDay,
    topSubjects,
    seasonBreakdown,
    gradeDistribution,
    eventCountsByType,
    pageViewsByDay,
    pageViewsByPath,
    errorLog: errorLog ?? [],
  })
}
