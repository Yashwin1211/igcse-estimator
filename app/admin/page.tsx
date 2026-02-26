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

type Range = '7d' | '30d' | '90d'

function getRangeStart(range: Range): string {
  const d = new Date()
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function getChartBuckets(range: Range): string[] {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const buckets: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    buckets.push(d.toISOString().split('T')[0])
  }
  return buckets
}

const RANGE_LABELS: Record<Range, string> = {
  '7d': 'last 7 days',
  '30d': 'last 30 days',
  '90d': 'last 90 days',
}

interface DayStat {
  day: string
  pvCount: number
  estCount: number
}

function ActivityChart({ data }: { data: DayStat[] }) {
  const n = data.length
  const barW = n <= 7 ? 32 : n <= 30 ? 14 : 5
  const gap = n <= 7 ? 8 : n <= 30 ? 5 : 2
  const h = 100
  const totalW = n * (barW + gap) - gap

  const maxVal = Math.max(...data.map((d) => d.pvCount + d.estCount), 1)
  const scale = (v: number) => (v / maxVal) * (h - 6)

  return (
    <svg
      viewBox={`0 0 ${totalW} ${h}`}
      style={{ width: '100%', height: 100, display: 'block' }}
      preserveAspectRatio="none"
    >
      {data.map((d, i) => {
        const x = i * (barW + gap)
        const pvH = scale(d.pvCount)
        const estH = scale(d.estCount)
        const totalH = pvH + estH

        return (
          <g key={i}>
            {/* Background slot */}
            <rect x={x} y={0} width={barW} height={h} fill="#111" rx={1} />
            {/* Page views (bottom, blue) */}
            {pvH > 0 && (
              <rect
                x={x}
                y={h - pvH}
                width={barW}
                height={pvH}
                fill="#3B5A9B"
                opacity={0.85}
                rx={1}
              />
            )}
            {/* Estimates saved (stacked on top, gold) */}
            {estH > 0 && (
              <rect
                x={x}
                y={h - totalH}
                width={barW}
                height={estH}
                fill="#C9A96E"
                opacity={0.9}
                rx={1}
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
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: string
}) {
  return (
    <div
      className="rounded-sm border p-5 flex flex-col gap-1.5"
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
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {sub && (
        <div className="text-xs" style={{ color: '#3D3D3D', fontFamily: 'var(--font-sans)' }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function FunnelRow({
  label,
  count,
  topCount,
  pct,
}: {
  label: string
  count: number
  topCount: number
  pct?: string
}) {
  const w = topCount > 0 ? (count / topCount) * 100 : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: '#888', fontFamily: 'var(--font-sans)' }}>
          {label}
        </span>
        <div className="flex items-center gap-3">
          {pct && (
            <span className="text-xs tabular-nums" style={{ color: '#3D3D3D', fontFamily: 'var(--font-sans)' }}>
              {pct}
            </span>
          )}
          <span className="font-display text-sm" style={{ color: '#F5F5F0' }}>
            {count.toLocaleString()}
          </span>
        </div>
      </div>
      <div style={{ height: 2, background: '#1E1E1E', borderRadius: 1 }}>
        <div
          style={{
            width: `${w}%`,
            height: '100%',
            background: 'linear-gradient(to right, #C9A96E, rgba(201,169,110,0.25))',
            borderRadius: 1,
          }}
        />
      </div>
    </div>
  )
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; range?: string }>
}) {
  const { token, range: rawRange = '30d' } = await searchParams
  const range: Range = rawRange === '7d' || rawRange === '90d' ? rawRange : '30d'

  if (!token || !process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    redirect('/')
  }

  const supabase = await createServiceClient()
  const rangeStart = getRangeStart(range)
  const buckets = getChartBuckets(range)

  const [
    { count: userCount },
    { count: totalEstimateCount },
    { data: ownershipRows },
    { data: estimatesInRange },
    { data: allEntries },
    { data: calcEvents },
    { data: allSavedEstimates },
    { data: eventsInRange },
    { data: pageViewEvents },
    { data: errorLog },
    { count: errorCount },
  ] = await Promise.all([
    // All-time totals
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('saved_estimates').select('*', { count: 'exact', head: true }),
    supabase.from('saved_estimates').select('user_id'),
    // Range-filtered
    supabase.from('saved_estimates').select('created_at').gte('created_at', rangeStart),
    // All-time deep data
    supabase.from('estimate_entries').select('subject_id, subjects(name, syllabus_code)'),
    supabase.from('analytics_events').select('event_data').eq('event_type', 'estimate_calculated'),
    supabase.from('saved_estimates').select('result'),
    // Range analytics events (includes session_id for unique-session calc)
    supabase
      .from('analytics_events')
      .select('event_type, created_at, session_id')
      .gte('created_at', rangeStart),
    // Page views all time (for path breakdown)
    supabase.from('analytics_events').select('event_data').eq('event_type', 'page_view'),
    // Error log
    supabase
      .from('analytics_events')
      .select('created_at, event_data')
      .eq('event_type', 'error')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('event_type', 'error'),
  ])

  // --- Derive metrics from eventsInRange ---

  const uniqueSessions = new Set(
    (eventsInRange ?? [])
      .map((e) => e.session_id as string | null)
      .filter((s): s is string => Boolean(s))
  ).size

  const pvCount = (eventsInRange ?? []).filter((e) => e.event_type === 'page_view').length
  const calcCount = (eventsInRange ?? []).filter((e) => e.event_type === 'estimate_calculated').length
  const savedCount = (eventsInRange ?? []).filter((e) => e.event_type === 'estimate_saved').length

  // Chart data
  const estimatesByBucketMap: Record<string, number> = {}
  for (const e of estimatesInRange ?? []) {
    const day = (e.created_at as string).split('T')[0]
    estimatesByBucketMap[day] = (estimatesByBucketMap[day] ?? 0) + 1
  }

  const pageViewsByBucketMap: Record<string, number> = {}
  for (const e of eventsInRange ?? []) {
    if (e.event_type === 'page_view') {
      const day = (e.created_at as string).split('T')[0]
      pageViewsByBucketMap[day] = (pageViewsByBucketMap[day] ?? 0) + 1
    }
  }

  const chartData: DayStat[] = buckets.map((day) => ({
    day,
    pvCount: pageViewsByBucketMap[day] ?? 0,
    estCount: estimatesByBucketMap[day] ?? 0,
  }))

  // --- All-time aggregations ---

  const guestCount = (ownershipRows ?? []).filter((e) => !e.user_id).length
  const registeredCount = (ownershipRows ?? []).filter((e) => e.user_id).length

  type SubjectRow = { name: string; syllabus_code: string }
  const subjectCountMap: Record<string, { name: string; code: string; count: number }> = {}
  for (const entry of allEntries ?? []) {
    const id = entry.subject_id as string
    const info = entry.subjects as unknown as SubjectRow | null
    if (!subjectCountMap[id]) {
      subjectCountMap[id] = { name: info?.name ?? id, code: info?.syllabus_code ?? '', count: 0 }
    }
    subjectCountMap[id].count++
  }
  const topSubjects = Object.values(subjectCountMap).sort((a, b) => b.count - a.count).slice(0, 10)
  const maxSubjectCount = topSubjects[0]?.count ?? 1

  const seasonBreakdown: Record<string, number> = { FM: 0, MJ: 0, ON: 0 }
  for (const event of calcEvents ?? []) {
    const season = (event.event_data as Record<string, unknown>)?.season as string
    if (season && season in seasonBreakdown) seasonBreakdown[season]++
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

  const totalPageViews = pageViewEvents?.length ?? 0
  const pageViewsByPath: Record<string, number> = {}
  for (const event of pageViewEvents ?? []) {
    const path = ((event.event_data as Record<string, unknown>)?.path as string) ?? 'unknown'
    pageViewsByPath[path] = (pageViewsByPath[path] ?? 0) + 1
  }
  const sortedPaths = Object.entries(pageViewsByPath).sort(([, a], [, b]) => b - a)

  const now = new Date()
  const rangeLabel = RANGE_LABELS[range]

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
            ANALYTICS
          </span>
        </div>

        <div className="flex items-center gap-6">
          {/* Range selector */}
          <div
            className="flex items-center rounded-sm border overflow-hidden"
            style={{ borderColor: '#2A2A2A', fontFamily: 'var(--font-sans)' }}
          >
            {(['7d', '30d', '90d'] as Range[]).map((r, i) => (
              <a
                key={r}
                href={`/admin?token=${token}&range=${r}`}
                style={{
                  display: 'inline-block',
                  padding: '5px 14px',
                  fontSize: '0.7rem',
                  letterSpacing: '0.05em',
                  textDecoration: 'none',
                  color: range === r ? '#F5F5F0' : '#444',
                  background: range === r ? '#1E1E1E' : 'transparent',
                  borderLeft: i > 0 ? '1px solid #2A2A2A' : 'none',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {r}
              </a>
            ))}
          </div>

          <div className="text-xs" style={{ color: '#3D3D3D', fontFamily: 'var(--font-sans)' }}>
            {format(now, 'd MMM yyyy · HH:mm')}
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-12 space-y-8">

        {/* Primary stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard
            label="Unique Sessions"
            value={uniqueSessions}
            sub={rangeLabel}
            accent="#C9A96E"
          />
          <StatCard label="Page Views" value={pvCount} sub={rangeLabel} />
          <StatCard label="Estimates Run" value={calcCount} sub={rangeLabel} />
          <StatCard label="Estimates Saved" value={savedCount} sub={rangeLabel} />
          <StatCard label="Registered Users" value={userCount ?? 0} sub="all time" />
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
          <div className="flex items-center justify-between mb-6">
            <div
              className="text-xs uppercase tracking-widest"
              style={{ color: '#555', fontFamily: 'var(--font-sans)' }}
            >
              Traffic — {rangeLabel}
            </div>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#C9A96E' }} />
                <span className="text-xs" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                  Estimates saved
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#3B5A9B' }} />
                <span className="text-xs" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                  Page views
                </span>
              </div>
            </div>
          </div>
          <ActivityChart data={chartData} />
          <div
            className="flex justify-between mt-2 text-xs"
            style={{ color: '#2A2A2A', fontFamily: 'var(--font-sans)' }}
          >
            <span>{buckets[0]}</span>
            <span>{buckets[buckets.length - 1]}</span>
          </div>
        </div>

        {/* Funnel + Page breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Conversion funnel */}
          <div
            className="rounded-sm border p-6"
            style={{
              background: 'linear-gradient(160deg, #181818 0%, #141414 100%)',
              borderColor: '#2A2A2A',
              boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
            }}
          >
            <div
              className="text-xs uppercase tracking-widest mb-6"
              style={{ color: '#555', fontFamily: 'var(--font-sans)' }}
            >
              Conversion Funnel — {rangeLabel}
            </div>
            <div className="space-y-5">
              <FunnelRow label="Page Views" count={pvCount} topCount={pvCount} />
              <FunnelRow
                label="Estimates Calculated"
                count={calcCount}
                topCount={pvCount}
                pct={pvCount > 0 ? `${((calcCount / pvCount) * 100).toFixed(1)}% of views` : undefined}
              />
              <FunnelRow
                label="Estimates Saved"
                count={savedCount}
                topCount={pvCount}
                pct={calcCount > 0 ? `${((savedCount / calcCount) * 100).toFixed(1)}% of calcs` : undefined}
              />
            </div>
          </div>

          {/* Traffic by page */}
          <div
            className="rounded-sm border p-6"
            style={{
              background: 'linear-gradient(160deg, #181818 0%, #141414 100%)',
              borderColor: '#2A2A2A',
              boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
            }}
          >
            <div
              className="text-xs uppercase tracking-widest mb-6"
              style={{ color: '#555', fontFamily: 'var(--font-sans)' }}
            >
              Traffic by Page — all time ({totalPageViews.toLocaleString()} total)
            </div>
            <div className="space-y-3">
              {sortedPaths.length > 0 ? (
                sortedPaths.slice(0, 8).map(([path, count]) => (
                  <div key={path} className="flex items-center gap-3">
                    <span
                      className="text-xs font-mono w-32 flex-shrink-0 truncate"
                      style={{ color: '#888' }}
                    >
                      {path}
                    </span>
                    <div
                      className="flex-1 relative"
                      style={{ height: 2, background: '#1E1E1E', borderRadius: 1 }}
                    >
                      <div
                        style={{
                          width: `${(count / (sortedPaths[0][1] ?? 1)) * 100}%`,
                          height: '100%',
                          background: 'linear-gradient(to right, #3B5A9B, rgba(59,90,155,0.2))',
                          borderRadius: 1,
                        }}
                      />
                    </div>
                    <span
                      className="text-xs tabular-nums w-8 text-right flex-shrink-0"
                      style={{ color: '#3B5A9B', fontFamily: 'var(--font-sans)' }}
                    >
                      {count}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-xs" style={{ color: '#333', fontFamily: 'var(--font-sans)' }}>
                  No data yet
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Secondary row: ownership + season + errors */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

          <div
            className="rounded-sm border p-5"
            style={{ background: '#141414', borderColor: '#2A2A2A' }}
          >
            <div
              className="text-xs uppercase tracking-widest mb-4"
              style={{ color: '#555', fontFamily: 'var(--font-sans)' }}
            >
              Estimate Ownership
            </div>
            <div className="flex gap-6 items-start">
              <div>
                <div className="font-display text-2xl font-light" style={{ color: '#F5F5F0' }}>
                  {registeredCount}
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                  registered
                </div>
              </div>
              <div style={{ width: 1, alignSelf: 'stretch', background: '#2A2A2A' }} />
              <div>
                <div className="font-display text-2xl font-light" style={{ color: '#F5F5F0' }}>
                  {guestCount}
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                  guest
                </div>
              </div>
              <div>
                <div className="font-display text-2xl font-light" style={{ color: '#F5F5F0' }}>
                  {totalEstimateCount ?? 0}
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                  total
                </div>
              </div>
            </div>
          </div>

          <div
            className="rounded-sm border p-5"
            style={{ background: '#141414', borderColor: '#2A2A2A' }}
          >
            <div
              className="text-xs uppercase tracking-widest mb-4"
              style={{ color: '#555', fontFamily: 'var(--font-sans)' }}
            >
              Season Breakdown
            </div>
            <div className="flex gap-3 flex-wrap">
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
                  <span className="font-display text-sm" style={{ color: '#C9A96E' }}>
                    {season}
                  </span>
                  <span className="text-xs" style={{ color: '#555' }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-sm border p-5"
            style={{ background: '#141414', borderColor: '#2A2A2A' }}
          >
            <div
              className="text-xs uppercase tracking-widest mb-4"
              style={{ color: '#555', fontFamily: 'var(--font-sans)' }}
            >
              Total Errors
            </div>
            <div
              className="font-display text-2xl font-light"
              style={{ color: (errorCount ?? 0) > 0 ? '#CF6679' : '#3D3D3D' }}
            >
              {errorCount ?? 0}
            </div>
            <div className="text-xs mt-0.5" style={{ color: '#3D3D3D', fontFamily: 'var(--font-sans)' }}>
              all time
            </div>
          </div>
        </div>

        {/* Subject popularity + Grade distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div
            className="rounded-sm border p-6"
            style={{
              background: 'linear-gradient(160deg, #181818 0%, #141414 100%)',
              borderColor: '#2A2A2A',
              boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
            }}
          >
            <div
              className="text-xs uppercase tracking-widest mb-5"
              style={{ color: '#555', fontFamily: 'var(--font-sans)' }}
            >
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
                    <div
                      className="flex-1 relative"
                      style={{ height: 2, background: '#1E1E1E', borderRadius: 1 }}
                    >
                      <div
                        style={{
                          width: `${(subject.count / maxSubjectCount) * 100}%`,
                          height: '100%',
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
                <span className="text-xs" style={{ color: '#333', fontFamily: 'var(--font-sans)' }}>
                  No data yet
                </span>
              )}
            </div>
          </div>

          <div
            className="rounded-sm border p-6"
            style={{
              background: 'linear-gradient(160deg, #181818 0%, #141414 100%)',
              borderColor: '#2A2A2A',
              boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
            }}
          >
            <div
              className="text-xs uppercase tracking-widest mb-5"
              style={{ color: '#555', fontFamily: 'var(--font-sans)' }}
            >
              Grade Distribution
            </div>
            {gradeDistribution.length > 0 ? (
              <>
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
                <div className="mt-6 pt-5" style={{ borderTop: '1px solid #1E1E1E' }}>
                  <div
                    className="text-xs uppercase tracking-widest mb-2"
                    style={{ color: '#555', fontFamily: 'var(--font-sans)' }}
                  >
                    Total grades estimated
                  </div>
                  <div className="font-display text-3xl font-light" style={{ color: '#F5F5F0' }}>
                    {gradeDistribution.reduce((sum, [, c]) => sum + c, 0).toLocaleString()}
                  </div>
                </div>
              </>
            ) : (
              <span className="text-xs" style={{ color: '#333', fontFamily: 'var(--font-sans)' }}>
                No data yet
              </span>
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
          <div
            className="text-xs uppercase tracking-widest mb-5"
            style={{ color: '#555', fontFamily: 'var(--font-sans)' }}
          >
            Recent Errors
          </div>
          {errorLog && errorLog.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ fontFamily: 'var(--font-sans)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
                    <th
                      className="text-left pb-2 pr-6 font-normal"
                      style={{ color: '#3D3D3D' }}
                    >
                      Time
                    </th>
                    <th
                      className="text-left pb-2 pr-6 font-normal"
                      style={{ color: '#3D3D3D' }}
                    >
                      Route
                    </th>
                    <th className="text-left pb-2 font-normal" style={{ color: '#3D3D3D' }}>
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {errorLog.map((err, i) => {
                    const data = err.event_data as Record<string, unknown> | null
                    return (
                      <tr
                        key={i}
                        style={{
                          borderBottom:
                            i < errorLog.length - 1 ? '1px solid #1A1A1A' : 'none',
                        }}
                      >
                        <td
                          className="py-2.5 pr-6 whitespace-nowrap"
                          style={{ color: '#555' }}
                        >
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
