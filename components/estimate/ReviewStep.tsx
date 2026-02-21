'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useEstimate } from './EstimateContext'
import { Button } from '@/components/ui'
import { trackEvent } from '@/lib/analytics'

const SESSIONS = [
  { value: 'FM', label: 'Feb / March', available: true },
  { value: 'MJ', label: 'May / June', available: true },
  { value: 'ON', label: 'Oct / Nov', available: true },
] as const

export function ReviewStep() {
  const { selectedSubjects, setStep, buildPayload, season, setSeason } = useEstimate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function calculate() {
    setLoading(true)
    setError(null)

    try {
      const payload = buildPayload()
      const res = await fetch('/api/estimate/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: payload, season }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Calculation failed')
      }

      const result = await res.json()

      trackEvent('estimate_calculated', {
        season,
        subject_count: payload.length,
        subjects: payload.map((e) => e.subject_id),
      })

      // Store result in sessionStorage to pass to results page
      sessionStorage.setItem('estimate_result', JSON.stringify({ result, entries: payload, season }))
      router.push('/results')
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-3xl font-light mb-2" style={{ color: '#F5F5F0' }}>
          Review
        </h2>
        <p className="text-sm" style={{ color: '#888', fontFamily: 'var(--font-sans)' }}>
          Check your marks before we calculate your estimated grades.
        </p>
      </div>

      {/* Session picker */}
      <div
        className="rounded-sm border p-5"
        style={{ background: '#141414', borderColor: '#2A2A2A' }}
      >
        <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
          Which session are you sitting?
        </div>
        <div className="flex gap-3">
          {SESSIONS.map(({ value, label, available }) => (
            <button
              key={value}
              onClick={() => available && setSeason(value)}
              disabled={!available}
              className="flex-1 py-3 text-sm rounded-sm border transition-all duration-200 font-medium tracking-wide relative"
              style={{
                fontFamily: 'var(--font-sans)',
                cursor: available ? 'pointer' : 'not-allowed',
                background: season === value
                  ? 'linear-gradient(135deg, rgba(201,169,110,0.12) 0%, rgba(201,169,110,0.06) 100%)'
                  : 'rgba(255,255,255,0.02)',
                borderColor: season === value ? 'rgba(201,169,110,0.5)' : '#2A2A2A',
                color: season === value ? '#C9A96E' : available ? '#555' : '#333',
                boxShadow: season === value ? '0 0 16px rgba(201,169,110,0.08)' : 'none',
              }}
            >
              {label}
              {!available && (
                <span className="block text-xs mt-0.5" style={{ color: '#2A2A2A', fontFamily: 'var(--font-sans)' }}>
                  coming soon
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {selectedSubjects.map((ss, i) => (
          <motion.div
            key={ss.subject.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-sm border p-5"
            style={{ background: '#141414', borderColor: '#2A2A2A' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs tracking-wider mb-0.5" style={{ color: '#C9A96E', fontFamily: 'var(--font-sans)' }}>
                  {ss.subject.syllabus_code}{ss.tier ? ` · ${ss.tier}` : ''}
                </div>
                <div className="font-display text-lg" style={{ color: '#F5F5F0' }}>
                  {ss.subject.name}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl" style={{ color: '#C9A96E' }}>
                  {ss.selectedPapers
                    .reduce((sum, p) => {
                      const m = ss.marks[p.id]
                      if (m === undefined || m < 0) return sum
                      return sum + (m / p.max_raw_mark) * p.weight_percentage
                    }, 0)
                    .toFixed(1)}
                  <span className="text-sm font-light" style={{ color: '#555' }}>%</span>
                </div>
                <div className="text-xs" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                  weighted
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {ss.selectedPapers.map((paper) => (
                <div
                  key={paper.id}
                  className="flex items-center justify-between text-sm"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  <span style={{ color: '#888' }}>{paper.name}</span>
                  <span style={{ color: '#F5F5F0' }}>
                    {ss.marks[paper.id] ?? '—'} / {paper.max_raw_mark}
                    <span className="ml-2 text-xs" style={{ color: '#555' }}>
                      ({paper.weight_percentage}%)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {error && (
        <p className="text-sm p-3 rounded-sm" style={{ background: 'rgba(207,102,121,0.1)', color: '#CF6679', fontFamily: 'var(--font-sans)', border: '1px solid rgba(207,102,121,0.2)' }}>
          {error}
        </p>
      )}

      <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #1E1E1E' }}>
        <Button variant="ghost" size="md" onClick={() => setStep(2)}>
          Back
        </Button>
        <Button variant="primary" size="md" loading={loading} onClick={calculate}>
          Calculate Grades
        </Button>
      </div>
    </div>
  )
}
