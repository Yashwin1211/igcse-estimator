'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { GradeCard } from '@/components/results/GradeCard'
import { Button } from '@/components/ui'
import { getOrCreateSessionId } from '@/lib/utils/session'
import type { EstimateResult, SubjectEstimateInput } from '@/types'

interface StoredEstimate {
  result: EstimateResult
  entries: SubjectEstimateInput[]
}

export default function ResultsPage() {
  const [data, setData] = useState<StoredEstimate | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const raw = sessionStorage.getItem('estimate_result')
    if (!raw) {
      router.push('/estimate')
      return
    }
    try {
      setData(JSON.parse(raw))
    } catch {
      router.push('/estimate')
    }
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

  return (
    <main className="min-h-screen" style={{ background: '#0C0C0C' }}>
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-8 py-5"
        style={{
          borderBottom: '1px solid rgba(30,30,30,0.8)',
          background: 'rgba(12,12,12,0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
        }}
      >
        <Link href="/dashboard" className="font-display text-lg tracking-wide" style={{ color: '#F5F5F0' }}>
          Threshold
        </Link>
        <div className="flex items-center gap-3">
          {!saved ? (
            <Button
              size="sm"
              variant="outline"
              loading={saving}
              onClick={saveEstimate}
            >
              Save results
            </Button>
          ) : (
            <span className="text-sm" style={{ color: '#4CAF78', fontFamily: 'var(--font-sans)' }}>
              Saved
            </span>
          )}
          <Link href="/estimate">
            <Button size="sm" variant="ghost">New estimate</Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-12">
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
          <h1 className="font-display text-4xl md:text-5xl font-light mb-2" style={{ color: '#F5F5F0' }}>
            {result.entries.length} subject{result.entries.length !== 1 ? 's' : ''} estimated
          </h1>
          <div className="flex items-center gap-3 flex-wrap mt-4">
            {Object.entries(gradeCount)
              .sort(([a], [b]) => {
                const order = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'U']
                return order.indexOf(a) - order.indexOf(b)
              })
              .map(([grade, count]) => (
                <div
                  key={grade}
                  className="flex items-center gap-1.5 text-sm px-3 py-1 rounded-sm border"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    background: 'rgba(201,169,110,0.05)',
                    borderColor: '#2A2A2A',
                    color: '#A8A8A8',
                  }}
                >
                  <span className="font-display text-base" style={{ color: '#C9A96E' }}>{grade}</span>
                  <span>×{count}</span>
                </div>
              ))}
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

        {/* Guest login prompt */}
        {!saved && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 p-5 rounded-sm border text-center"
            style={{ background: '#141414', borderColor: '#2A2A2A' }}
          >
            <p className="text-sm mb-3" style={{ color: '#888', fontFamily: 'var(--font-sans)' }}>
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
