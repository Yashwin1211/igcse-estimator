'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { trackEvent } from '@/lib/analytics'
import type { EstimateResult, Grade } from '@/types'

interface SavedEstimate {
  id: string
  label: string | null
  created_at: string
  result: EstimateResult
}

const GRADE_ORDER = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'U']

const gradeColor: Record<string, string> = {
  'A*': '#C9A96E',
  'A':  '#B8C9A9',
  'B':  '#A9B8C9',
  'C':  '#C9B8A9',
  'D':  '#888888',
  'E':  '#666666',
  'F':  '#555555',
  'G':  '#444444',
  'U':  '#CF6679',
}

function gradeDistribution(result: EstimateResult) {
  const counts: Record<string, number> = {}
  result.entries.forEach((e) => {
    const g = e.estimated_grade ?? 'U'
    counts[g] = (counts[g] ?? 0) + 1
  })
  return Object.entries(counts).sort(
    ([a], [b]) => GRADE_ORDER.indexOf(a) - GRADE_ORDER.indexOf(b)
  )
}

function EstimateCard({
  est,
  index,
  onDelete,
}: {
  est: SavedEstimate
  index: number
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const dist = gradeDistribution(est.result)
  const subjectCount = est.result.entries.length

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    setDeleting(true)
    const res = await fetch(`/api/estimates/${est.id}`, { method: 'DELETE' })
    if (res.ok) {
      trackEvent('estimate_deleted')
      onDelete(est.id)
    } else {
      setDeleting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="rounded-sm border overflow-hidden cursor-pointer"
      style={{
        background: 'linear-gradient(160deg, #181818 0%, #141414 100%)',
        borderColor: expanded ? '#3A3A3A' : '#2A2A2A',
        boxShadow: expanded
          ? '0 1px 0 rgba(255,255,255,0.05) inset, 0 12px 40px rgba(0,0,0,0.5)'
          : '0 1px 0 rgba(255,255,255,0.03) inset, 0 4px 16px rgba(0,0,0,0.3)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onClick={() => setExpanded((v) => !v)}
    >
      {/* Card header */}
      <div className="px-6 py-5 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Date + label */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
              {format(new Date(est.created_at), 'd MMM yyyy')}
            </span>
            {est.label && (
              <span className="text-xs px-2 py-0.5 rounded-sm border" style={{ color: '#C9A96E', borderColor: 'rgba(201,169,110,0.2)', background: 'rgba(201,169,110,0.06)', fontFamily: 'var(--font-sans)' }}>
                {est.label}
              </span>
            )}
          </div>

          {/* Grade distribution pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {dist.map(([grade, count]) => (
              <div
                key={grade}
                className="flex items-center gap-1 px-2.5 py-1 rounded-sm border"
                style={{
                  borderColor: `${gradeColor[grade]}30`,
                  background: `${gradeColor[grade]}0D`,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <span className="font-display text-base leading-none" style={{ color: gradeColor[grade] }}>
                  {grade}
                </span>
                {count > 1 && (
                  <span className="text-xs" style={{ color: gradeColor[grade], opacity: 0.7 }}>×{count}</span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-2 text-xs" style={{ color: '#3D3D3D', fontFamily: 'var(--font-sans)' }}>
            {subjectCount} subject{subjectCount !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Expand chevron */}
          <motion.svg
            width="16" height="16" viewBox="0 0 16 16" fill="none"
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ color: '#444' }}
          >
            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs transition-colors cursor-pointer disabled:opacity-30 hover:opacity-100"
            style={{ color: '#3D3D3D', fontFamily: 'var(--font-sans)', opacity: 0.7 }}
          >
            {deleting ? '...' : 'Remove'}
          </button>
        </div>
      </div>

      {/* Expanded subject rows */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ borderTop: '1px solid #222' }}
          >
            <div className="px-6 py-4 space-y-0">
              {est.result.entries.map((entry, i) => {
                const color = gradeColor[entry.estimated_grade ?? 'U'] ?? '#888'
                return (
                  <div
                    key={entry.subject_id}
                    className="flex items-center justify-between py-3"
                    style={{
                      borderBottom: i < est.result.entries.length - 1 ? '1px solid #1E1E1E' : 'none',
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-light truncate block" style={{ color: '#C8C8C3', fontFamily: 'var(--font-display)' }}>
                        {entry.subject_name}
                      </span>
                      {entry.tier_selected && (
                        <span className="text-xs" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                          {entry.tier_selected}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="text-xs tabular-nums" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                        {entry.weighted_total_pct.toFixed(1)}%
                      </span>
                      <div
                        className="w-9 h-9 rounded-sm border flex items-center justify-center font-display text-lg font-light"
                        style={{
                          borderColor: `${color}40`,
                          background: `${color}0D`,
                          color,
                        }}
                      >
                        {entry.estimated_grade ?? 'U'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function SignOutButton() {
  const [loading, setLoading] = useState(false)
  async function handleSignOut() {
    setLoading(true)
    await createClient().auth.signOut()
    window.location.href = '/'
  }
  return (
    <Button size="sm" variant="ghost" loading={loading} onClick={handleSignOut}>
      Sign out
    </Button>
  )
}

export default function DashboardPage() {
  const [estimates, setEstimates] = useState<SavedEstimate[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    trackEvent('page_view', { path: '/dashboard' })

    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserName(user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? '')
      }

      const res = await fetch('/api/estimates')
      if (res.ok) {
        const data = await res.json()
        setEstimates(data.filter((e: SavedEstimate) => e.result?.entries?.length > 0))
      }
      setLoading(false)
    }
    load()
  }, [])

  function handleDelete(id: string) {
    setEstimates((prev) => prev.filter((e) => e.id !== id))
  }

  const totalSubjects = estimates.reduce((sum, e) => sum + (e.result?.entries?.length ?? 0), 0)
  const allGrades = estimates.flatMap((e) => e.result?.entries?.map((en) => en.estimated_grade) ?? [])
  const topGrade = allGrades.sort((a, b) => GRADE_ORDER.indexOf(a ?? 'U') - GRADE_ORDER.indexOf(b ?? 'U'))[0]

  return (
    <main className="min-h-screen" style={{ background: '#0C0C0C' }}>
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-8 py-5"
        style={{
          borderBottom: '1px solid rgba(30,30,30,0.8)',
          background: 'rgba(12,12,12,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <Link href="/dashboard" className="font-display text-lg tracking-wide" style={{ color: '#F5F5F0' }}>
          Threshold
        </Link>
        <div className="flex items-center gap-4">
          {userName && (
            <span className="text-sm hidden sm:block" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
              {userName}
            </span>
          )}
          <SignOutButton />
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-14">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="text-xs tracking-[0.25em] uppercase mb-3" style={{ color: '#C9A96E', fontFamily: 'var(--font-sans)' }}>
            Dashboard
          </div>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <h1 className="font-display text-4xl md:text-5xl font-light" style={{ color: '#F5F5F0', letterSpacing: '-0.02em' }}>
              {userName ? `${userName.split(' ')[0]}'s estimates` : 'Your estimates'}
            </h1>
            <Link href="/estimate">
              <Button size="sm" variant="primary">New estimate</Button>
            </Link>
          </div>

          {/* Stats row */}
          {!loading && estimates.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-6 mt-6"
            >
              <div>
                <div className="font-display text-2xl font-light" style={{ color: '#F5F5F0' }}>{estimates.length}</div>
                <div className="text-xs mt-0.5" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>saved estimates</div>
              </div>
              <div style={{ width: '1px', height: '32px', background: '#2A2A2A' }} />
              <div>
                <div className="font-display text-2xl font-light" style={{ color: '#F5F5F0' }}>{totalSubjects}</div>
                <div className="text-xs mt-0.5" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>subjects estimated</div>
              </div>
              {topGrade && (
                <>
                  <div style={{ width: '1px', height: '32px', background: '#2A2A2A' }} />
                  <div>
                    <div className="font-display text-2xl font-light" style={{ color: gradeColor[topGrade] ?? '#C9A96E' }}>{topGrade}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>best grade</div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-sm animate-pulse"
                style={{ background: 'linear-gradient(160deg, #181818 0%, #141414 100%)', border: '1px solid #222' }}
              />
            ))}
          </div>
        ) : estimates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 rounded-sm border"
            style={{
              background: 'linear-gradient(160deg, #161616 0%, #121212 100%)',
              borderColor: '#2A2A2A',
              boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
            }}
          >
            <div className="font-display text-5xl font-light mb-4" style={{ color: '#222' }}>—</div>
            <p className="font-display text-xl font-light mb-2" style={{ color: '#444' }}>
              No saved estimates
            </p>
            <p className="text-sm mb-8" style={{ color: '#333', fontFamily: 'var(--font-sans)' }}>
              Run your first estimate and save your results to see them here.
            </p>
            <Link href="/estimate">
              <Button size="md" variant="primary">Start estimating</Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {estimates.map((est, i) => (
              <EstimateCard key={est.id} est={est} index={i} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
