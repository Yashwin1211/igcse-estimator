import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import type { EstimateResult } from '@/types'

const GRADE_ORDER = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'U']

const gradeColor: Record<string, string> = {
  'A*': '#C9A96E',
  A: '#B8C9A9',
  B: '#A9B8C9',
  C: '#C9B8A9',
  D: '#888888',
  E: '#666666',
  F: '#555555',
  G: '#444444',
  U: '#CF6679',
}

function getLast30Days(): string[] {
  const days: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

interface DayStat {
  day: string
  count: number
}

function ActivityChart({
  estimatesByDay,
  pageViewsByDay,
}: {
  estimatesByDay: DayStat[]
  pageViewsByDay: DayStat[]
}) {
  const barW = 14
  const gap = 5
  const h = 80
  const totalW = 30 * (barW + gap) - gap

  const maxVal = Math.max(
    ...estimatesByDay.map((d, i) => d.count + (pageViewsByDay[i]?.count ?? 0)),
    1
  )

  const scale = (v: number) => (v / maxVal) * (h - 4)

  return (
    <svg
      viewBox={`0 0 ${totalW} ${h}`}
      style={{ width: '100%', height: 80, display: 'block' }}
      preserveAspectRatio="none"
    >
      {Array.from({ length: 30 }, (_, i) => {
        const x = i * (barW + gap)
        const pvCount = pageViewsByDay[i]?.count ?? 0
        const estCount = estimatesByDay[i]?.count ?? 0
        const pvH = scale(pvCount)
        const estH = scale(estCount)
        const totalH = pvH + estH

        return (
          <g key={i}>
            {/* Baseline */}
            <rect x={x} y={h - 1} width={barW} height={1} fill="#222" />
            {/* Page views (bottom, blue) */}
            {pvH > 0 && (
              <rect
                x={x}
                y={h - totalH}
                width={barW}
                height={pvH}
                fill="#3B5A9B"
                opacity={0.8}
              />
            )}
            {/* Estimates (top, gold) */}
            {estH > 0 && (
              <rect
                x={x}
                y={h - totalH}
                width={barW}
                height={estH}
                fill="#C9A96E"
                opacity={0.9}
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  accent?: string
}) {
  return (
    <div
      className="rounded-sm border p-6 flex flex-col gap-2"
      style={{
        background: 'linear-gradient(160deg, #181818 0%, #141414 100%)',
        borderColor: '#2A2A2A',
        boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
      }}
    >
      <div
        className="text-xs uppercase tracking-widest"
        style={{ color: '#555', fontFamily: 'var(--font-sans)' }}
      >
        {label}
      </div>
      <div
        className="font-display text-4xl font-light leading-none"
        style={{ color: accent ?? '#F5F5F0' }}
      >
        {value}
      </div>
    </div>
  )
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token || !process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    redirect('/')
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
    supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('event_type', 'error'),
  ])

  // --- Aggregations ---

  const guestCount = allEstimatesOwnership?.filter((e) => !e.user_id).length ?? 0
  const registeredCount = allEstimatesOwnership?.filter((e) => e.user_id).length ?? 0

  const days = getLast30Days()

  const estimatesByDayMap: Record<string, number> = {}
  for (const e of estimatesLast30 ?? []) {
    const day = (e.created_at as string).split('T')[0]
    estimatesByDayMap[day] = (estimatesByDayMap[day] ?? 0) + 1
  }
  const estimatesByDay: DayStat[] = days.map((d) => ({ day: d, count: estimatesByDayMap[d] ?? 0 }))

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
  const maxSubjectCount = topSubjects[0]?.count ?? 1

  const seasonBreakdown: Record<string, number> = { FM: 0, MJ: 0, ON: 0 }
  for (const event of calcEvents ?? []) {
    const season = (event.event_data as Record<string, unknown>)?.season as string
    if (season && season in seasonBreakdown) {
      seasonBreakdown[season]++
    }
  }

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

  const pageViewsByDayMap: Record<string, number> = {}
  for (const event of recentEvents ?? []) {
    if ((event.event_type as string) === 'page_view') {
      const day = (event.created_at as string).split('T')[0]
      pageViewsByDayMap[day] = (pageViewsByDayMap[day] ?? 0) + 1
    }
  }
  const pageViewsByDay: DayStat[] = days.map((d) => ({ day: d, count: pageViewsByDayMap[d] ?? 0 }))

  const totalPageViews = pageViewEvents?.length ?? 0

  const pageViewsByPath: Record<string, number> = {}
  for (const event of pageViewEvents ?? []) {
    const path =
      ((event.event_data as Record<string, unknown>)?.path as string) ?? 'unknown'
    pageViewsByPath[path] = (pageViewsByPath[path] ?? 0) + 1
  }

  const now = new Date()

  return (
    <main className="min-h-screen" style={{ background: '#0C0C0C' }}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-8 py-4"
        style={{
          borderBottom: '1px solid rgba(30,30,30,0.8)',
          background: 'rgba(12,12,12,0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
        }}
      >
        <div className="flex items-center gap-4">
          <span className="font-display text-xl tracking-wide" style={{ color: '#F5F5F0' }}>
            Threshold
          </span>
          <span
            className="text-xs px-2 py-1 rounded-sm border"
            style={{
              color: '#C9A96E',
              borderColor: 'rgba(201,169,110,0.25)',
              background: 'rgba(201,169,110,0.08)',
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.1em',
            }}
          >
            ADMIN
          </span>
        </div>
        <div className="text-xs" style={{ color: '#3D3D3D', fontFamily: 'var(--font-sans)' }}>
          {format(now, 'd MMM yyyy · HH:mm')}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-12 space-y-10">

        {/* Top stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={userCount ?? 0} accent="#C9A96E" />
          <StatCard label="Saved Estimates" value={estimateCount ?? 0} />
          <StatCard label="Page Views" value={totalPageViews} />
          <StatCard label="Errors" value={errorCount ?? 0} accent={(errorCount ?? 0) > 0 ? '#CF6679' : undefined} />
        </div>

        {/* Secondary stat row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div
            className="rounded-sm border p-5"
            style={{ background: '#141414', borderColor: '#2A2A2A' }}
          >
            <div className="text-xs uppercase tracking-widest mb-4" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
              Estimate Ownership
            </div>
            <div className="flex gap-6">
              <div>
                <div className="font-display text-2xl font-light" style={{ color: '#F5F5F0' }}>{registeredCount}</div>
                <div className="text-xs mt-0.5" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>registered</div>
              </div>
              <div style={{ width: 1, background: '#2A2A2A' }} />
              <div>
                <div className="font-display text-2xl font-light" style={{ color: '#F5F5F0' }}>{guestCount}</div>
                <div className="text-xs mt-0.5" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>guest</div>
              </div>
            </div>
          </div>

          {/* Season breakdown */}
          <div
            className="rounded-sm border p-5"
            style={{ background: '#141414', borderColor: '#2A2A2A' }}
          >
            <div className="text-xs uppercase tracking-widest mb-4" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
              Season Breakdown
            </div>
            <div className="flex gap-4 flex-wrap">
              {Object.entries(seasonBreakdown).map(([season, count]) => (
                <div
                  key={season}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-sm border"
                  style={{
                    borderColor: 'rgba(201,169,110,0.2)',
                    background: 'rgba(201,169,110,0.06)',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <span className="font-display text-sm" style={{ color: '#C9A96E' }}>{season}</span>
                  <span className="text-xs" style={{ color: '#555' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Page views by path */}
          <div
            className="rounded-sm border p-5"
            style={{ background: '#141414', borderColor: '#2A2A2A' }}
          >
            <div className="text-xs uppercase tracking-widest mb-4" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
              Page Views by Path
            </div>
            <div className="space-y-1.5">
              {Object.entries(pageViewsByPath)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([path, count]) => (
                  <div key={path} className="flex items-center justify-between">
                    <span
                      className="text-xs font-mono truncate max-w-[140px]"
                      style={{ color: '#888' }}
                    >
                      {path}
                    </span>
                    <span className="text-xs tabular-nums ml-2" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                      {count}
                    </span>
                  </div>
                ))}
              {Object.keys(pageViewsByPath).length === 0 && (
                <span className="text-xs" style={{ color: '#333', fontFamily: 'var(--font-sans)' }}>No data yet</span>
              )}
            </div>
          </div>
        </div>

        {/* Activity chart */}
        <div
          className="rounded-sm border p-6"
          style={{
            background: 'linear-gradient(160deg, #181818 0%, #141414 100%)',
            borderColor: '#2A2A2A',
            boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
          }}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-xs uppercase tracking-widest mb-1" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                Activity — last 30 days
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#C9A96E' }} />
                <span className="text-xs" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>Estimates saved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#3B5A9B' }} />
                <span className="text-xs" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>Page views</span>
              </div>
            </div>
          </div>
          <ActivityChart estimatesByDay={estimatesByDay} pageViewsByDay={pageViewsByDay} />
          <div className="flex justify-between mt-2 text-xs" style={{ color: '#2A2A2A', fontFamily: 'var(--font-sans)' }}>
            <span>{days[0]}</span>
            <span>{days[29]}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subject popularity */}
          <div
            className="rounded-sm border p-6"
            style={{
              background: 'linear-gradient(160deg, #181818 0%, #141414 100%)',
              borderColor: '#2A2A2A',
              boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
            }}
          >
            <div className="text-xs uppercase tracking-widest mb-5" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
              Most Popular Subjects
            </div>
            <div className="space-y-3">
              {topSubjects.length > 0 ? (
                topSubjects.map((subject, i) => (
                  <div key={subject.code || i} className="flex items-center gap-3">
                    <span
                      className="text-xs w-5 text-right flex-shrink-0 tabular-nums"
                      style={{ color: '#3D3D3D', fontFamily: 'var(--font-sans)' }}
                    >
                      {i + 1}
                    </span>
                    <span
                      className="text-xs w-28 flex-shrink-0 truncate"
                      style={{ color: '#888', fontFamily: 'var(--font-sans)' }}
                    >
                      {subject.name}
                    </span>
                    <div className="flex-1 relative" style={{ height: 2, background: '#1E1E1E', borderRadius: 1 }}>
                      <div
                        className="absolute inset-y-0 left-0"
                        style={{
                          width: `${(subject.count / maxSubjectCount) * 100}%`,
                          background: 'linear-gradient(to right, #C9A96E, rgba(201,169,110,0.3))',
                          borderRadius: 1,
                        }}
                      />
                    </div>
                    <span
                      className="text-xs tabular-nums w-8 text-right flex-shrink-0"
                      style={{ color: '#C9A96E', fontFamily: 'var(--font-sans)' }}
                    >
                      {subject.count}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-xs" style={{ color: '#333', fontFamily: 'var(--font-sans)' }}>No data yet</span>
              )}
            </div>
          </div>

          {/* Grade distribution */}
          <div
            className="rounded-sm border p-6"
            style={{
              background: 'linear-gradient(160deg, #181818 0%, #141414 100%)',
              borderColor: '#2A2A2A',
              boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
            }}
          >
            <div className="text-xs uppercase tracking-widest mb-5" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
              Grade Distribution
            </div>
            {gradeDistribution.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {gradeDistribution.map(([grade, count]) => {
                  const color = gradeColor[grade] ?? '#888'
                  return (
                    <div
                      key={grade}
                      className="flex items-center gap-2 px-3 py-2 rounded-sm border"
                      style={{
                        borderColor: `${color}30`,
                        background: `${color}0D`,
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      <span className="font-display text-base" style={{ color }}>
                        {grade}
                      </span>
                      <span className="text-xs" style={{ color: `${color}99` }}>
                        ×{count}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <span className="text-xs" style={{ color: '#333', fontFamily: 'var(--font-sans)' }}>No data yet</span>
            )}

            {gradeDistribution.length > 0 && (
              <div className="mt-6 pt-5" style={{ borderTop: '1px solid #1E1E1E' }}>
                <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                  Total grades estimated
                </div>
                <div className="font-display text-3xl font-light" style={{ color: '#F5F5F0' }}>
                  {gradeDistribution.reduce((sum, [, c]) => sum + c, 0)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent errors */}
        <div
          className="rounded-sm border p-6"
          style={{
            background: 'linear-gradient(160deg, #181818 0%, #141414 100%)',
            borderColor: '#2A2A2A',
            boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
          }}
        >
          <div className="text-xs uppercase tracking-widest mb-5" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
            Recent Errors
          </div>
          {errorLog && errorLog.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ fontFamily: 'var(--font-sans)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
                    <th className="text-left pb-2 pr-6 font-normal" style={{ color: '#3D3D3D' }}>Time</th>
                    <th className="text-left pb-2 pr-6 font-normal" style={{ color: '#3D3D3D' }}>Route</th>
                    <th className="text-left pb-2 font-normal" style={{ color: '#3D3D3D' }}>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {errorLog.map((err, i) => {
                    const data = err.event_data as Record<string, unknown> | null
                    return (
                      <tr
                        key={i}
                        style={{ borderBottom: i < errorLog.length - 1 ? '1px solid #1A1A1A' : 'none' }}
                      >
                        <td className="py-2.5 pr-6 whitespace-nowrap" style={{ color: '#555' }}>
                          {format(new Date(err.created_at as string), 'd MMM · HH:mm')}
                        </td>
                        <td className="py-2.5 pr-6 font-mono" style={{ color: '#888' }}>
                          {(data?.route as string) ?? '—'}
                        </td>
                        <td className="py-2.5 max-w-xs truncate" style={{ color: '#CF6679' }}>
                          {(data?.message as string) ?? '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              className="py-8 text-center text-sm"
              style={{ color: '#333', fontFamily: 'var(--font-sans)' }}
            >
              No errors recorded
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
