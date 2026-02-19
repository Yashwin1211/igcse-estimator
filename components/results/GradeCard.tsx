'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { GradeBadge } from '@/components/ui'
import { BoundaryChart } from './BoundaryChart'
import type { SubjectEstimateResult } from '@/types'

interface GradeCardProps {
  result: SubjectEstimateResult
  index: number
}

const GRADE_LABELS: Record<string, string> = {
  'A*': 'Outstanding',
  'A':  'Excellent',
  'B':  'Good',
  'C':  'Satisfactory',
  'D':  'Limited',
  'E':  'Very Limited',
  'F':  'Extremely Limited',
  'G':  'Minimal',
  'U':  'Ungraded',
}

export function GradeCard({ result, index }: GradeCardProps) {
  const [showChart, setShowChart] = useState(false)

  const estimatedThreshold = result.thresholds.find(
    (t) => t.grade === result.estimated_grade
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="rounded-sm border p-6"
      style={{
        background: 'linear-gradient(160deg, #181818 0%, #141414 100%)',
        borderColor: '#2A2A2A',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-xs tracking-wider mb-1" style={{ color: '#C9A96E', fontFamily: 'var(--font-sans)' }}>
            {result.subject_code}{result.tier_selected ? ` · ${result.tier_selected}` : ''}
          </div>
          <h3 className="font-display text-2xl font-light" style={{ color: '#F5F5F0' }}>
            {result.subject_name}
          </h3>
          {result.estimated_grade && (
            <div className="mt-1 text-xs" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
              {GRADE_LABELS[result.estimated_grade]}
            </div>
          )}
        </div>

        <div className="text-right flex flex-col items-end gap-3">
          <GradeBadge grade={result.estimated_grade} />
          <div>
            <div className="font-display text-3xl" style={{ color: '#F5F5F0' }}>
              {result.weighted_total_pct.toFixed(1)}
              <span className="text-lg font-light" style={{ color: '#555' }}>%</span>
            </div>
            <div className="text-xs" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
              weighted total
            </div>
          </div>
        </div>
      </div>

      {/* Threshold bars */}
      <div className="space-y-2 mb-5">
        {result.thresholds.slice(0, 4).map((t) => {
          const isUserGrade = t.grade === result.estimated_grade
          const userAbove = result.weighted_total_pct >= t.averaged_pct

          return (
            <div key={t.grade}>
              <div className="flex items-center justify-between mb-1 text-xs" style={{ fontFamily: 'var(--font-sans)' }}>
                <div className="flex items-center gap-2">
                  <span
                    className="w-6 text-center font-medium"
                    style={{ color: isUserGrade ? '#C9A96E' : '#888' }}
                  >
                    {t.grade}
                  </span>
                  <span style={{ color: '#555' }}>
                    avg {t.averaged_pct.toFixed(1)}%
                    <span className="ml-1" style={{ color: '#3D3D3D' }}>
                      ({t.min_pct.toFixed(0)}–{t.max_pct.toFixed(0)}%)
                    </span>
                  </span>
                </div>
                {isUserGrade && (
                  <span style={{ color: '#C9A96E' }}>← estimated</span>
                )}
              </div>

              {/* Bar */}
              <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1E1E1E' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(t.averaged_pct, 100)}%`,
                    background: isUserGrade
                      ? '#C9A96E'
                      : userAbove
                      ? 'rgba(201,169,110,0.3)'
                      : '#2A2A2A',
                  }}
                />
              </div>
            </div>
          )
        })}

        {/* User score marker */}
        <div className="relative h-2 mt-1">
          <div
            className="absolute top-0 bottom-0 w-0.5 rounded-full"
            style={{
              left: `${Math.min(result.weighted_total_pct, 100)}%`,
              background: '#C9A96E',
            }}
          />
        </div>
      </div>

      {/* Confidence note */}
      {estimatedThreshold && (
        <p className="text-xs mb-4" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
          {result.estimated_grade} boundary has ranged {estimatedThreshold.min_pct.toFixed(1)}–{estimatedThreshold.max_pct.toFixed(1)}% over the past 5 FM series.
          {result.weighted_total_pct < estimatedThreshold.max_pct
            ? ' Your score may not reach this grade in some years.'
            : ' Your score exceeds the highest recorded boundary.'}
        </p>
      )}

      {result.missing_papers && (
        <p className="text-xs mb-4 p-2 rounded-sm" style={{ color: '#C9A96E', background: 'rgba(201,169,110,0.05)', border: '1px solid rgba(201,169,110,0.15)', fontFamily: 'var(--font-sans)' }}>
          Some papers had no mark entered. Grade was estimated from available papers only.
        </p>
      )}

      {/* Chart toggle */}
      <button
        onClick={() => setShowChart(!showChart)}
        className="text-xs transition-colors cursor-pointer"
        style={{ color: showChart ? '#C9A96E' : '#555', fontFamily: 'var(--font-sans)' }}
      >
        {showChart ? 'Hide' : 'Show'} boundary trends
      </button>

      {showChart && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4 pt-4"
          style={{ borderTop: '1px solid #1E1E1E' }}
        >
          <BoundaryChart
            thresholds={result.thresholds}
            userPct={result.weighted_total_pct}
          />
        </motion.div>
      )}
    </motion.div>
  )
}
