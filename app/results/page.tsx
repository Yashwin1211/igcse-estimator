'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { GradeCard } from '@/components/results/GradeCard'
import { Button } from '@/components/ui'
import { getOrCreateSessionId } from '@/lib/utils/session'
import { createClient } from '@/lib/supabase/client'
import { trackEvent } from '@/lib/analytics'
import type { EstimateResult, SubjectEstimateInput } from '@/types'

interface StoredEstimate {
  result: EstimateResult
  entries: SubjectEstimateInput[]
}

const GRADE_ORDER = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'U']

function gradeColor(grade: string | null): string {
  if (!grade) return '#555'
  switch (grade) {
    case 'A*': return '#C9A96E'
    case 'A':  return '#B8C9A9'
    case 'B':  return '#A9B8C9'
    case 'C':  return '#C9B8A9'
    default:   return '#888'
  }
}

export default function ResultsPage() {
  const [data, setData] = useState<StoredEstimate | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    trackEvent('page_view', { path: '/results' })

    const raw = sessionStorage.getItem('estimate_result')
    if (!raw) { router.push('/estimate'); return }
    try { setData(JSON.parse(raw)) } catch { router.push('/estimate') }

    createClient().auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })
  }, [router])

  async function saveEstimate() {
    if (!data) return
    setSaving(true)
    setSaveError(null)

    try {
      const sessionId = getOrCreateSessionId()
      const res = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          entries: data.entries,
          result: data.result,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Save failed')
      }

      trackEvent('estimate_saved')
      setSaved(true)
    } catch (err) {
      setSaveError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (!data) return null

  const { result } = data
  const gradeCount = result.entries.reduce<Record<string, number>>((acc, e) => {
    const g = e.estimated_grade ?? 'U'
    acc[g] = (acc[g] ?? 0) + 1
    return acc
  }, {})

  const sortedGrades = Object.entries(gradeCount).sort(([a], [b]) =>
    GRADE_ORDER.indexOf(a) - GRADE_ORDER.indexOf(b)
  )

  const avgWeighted = result.entries.length > 0
    ? result.entries.reduce((s, e) => s + (e.weighted_total_pct ?? 0), 0) / result.entries.length
    : 0

  return (
    <main className="min-h-screen relative" style={{ background: '#0C0C0C' }}>
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(201,169,110,0.04) 0%, transparent 60%)',
          zIndex: 0,
        }}
      />

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
        <Link
          href={isLoggedIn ? '/dashboard' : '/'}
          className="font-display text-xl tracking-wide transition-opacity hover:opacity-70"
          style={{ color: '#F5F5F0' }}
        >
          Threshold
        </Link>
        <div className="flex items-center gap-3">
          {!saved ? (
            <Button
              size="sm"
              variant="primary"
              loading={saving}
              onClick={saveEstimate}
            >
              Save results
            </Button>
          ) : (
            <span className="text-sm flex items-center gap-1.5" style={{ color: '#4CAF78', fontFamily: 'var(--font-sans)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7L5.5 10L11.5 4" stroke="#4CAF78" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Saved
            </span>
          )}
          <Link href="/estimate">
            <Button size="sm" variant="ghost">New estimate</Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-12 relative z-10">
        {/* Summary header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="text-xs tracking-[0.25em] uppercase mb-3" style={{ color: '#C9A96E', fontFamily: 'var(--font-sans)' }}>
            Grade Estimate
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-light mb-6" style={{ color: '#F5F5F0' }}>
            <span style={{ fontFamily: 'var(--font-sans)' }}>{result.entries.length}</span> subject{result.entries.length !== 1 ? 's' : ''} estimated
          </h1>

          {/* Grade breakdown bar */}
          <div
            className="p-5 rounded-sm border"
            style={{
              background: 'linear-gradient(135deg, #181818 0%, #141414 100%)',
              borderColor: '#2A2A2A',
              boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset, 0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs uppercase tracking-widest" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                Grade breakdown
              </div>
              <div className="text-xs" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                Avg weighted: <span style={{ color: '#C9A96E' }}>{avgWeighted.toFixed(1)}%</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {sortedGrades.map(([grade, count]) => (
                <div
                  key={grade}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-sm border"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    background: 'rgba(255,255,255,0.02)',
                    borderColor: '#2A2A2A',
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: gradeColor(grade) }}
                  />
                  <span className="font-display text-lg" style={{ color: gradeColor(grade) }}>
                    {grade}
                  </span>
                  <span className="text-sm" style={{ color: '#555' }}>×{count}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Grade cards */}
        <div className="space-y-4">
          {result.entries.map((entry, i) => (
            <GradeCard key={entry.subject_id} result={entry} index={i} />
          ))}
        </div>

        {saveError && (
          <p className="mt-4 text-sm" style={{ color: '#CF6679', fontFamily: 'var(--font-sans)' }}>
            {saveError}
          </p>
        )}

        {/* Guest prompt */}
        {!isLoggedIn && !saved && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 p-6 rounded-sm border text-center"
            style={{
              background: 'linear-gradient(160deg, #181818 0%, #141414 100%)',
              borderColor: '#2A2A2A',
              boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
            }}
          >
            <div className="font-display text-lg mb-2" style={{ color: '#F5F5F0' }}>
              Save your results
            </div>
            <p className="text-sm mb-4" style={{ color: '#888', fontFamily: 'var(--font-sans)' }}>
              Create an account to save and track your estimates over time.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/auth/signup">
                <Button size="sm" variant="primary">Create account</Button>
              </Link>
              <Link href="/auth/login">
                <Button size="sm" variant="ghost">Sign in</Button>
              </Link>
            </div>
          </motion.div>
        )}

        <div className="mt-8 text-center">
          <Link href="/estimate">
            <Button variant="ghost" size="md">Start a new estimate</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
