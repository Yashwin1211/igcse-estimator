'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'

const steps = [
  {
    number: '01',
    title: 'Select Subjects',
    description: 'Choose from 18 Cambridge IGCSE subjects across sciences, mathematics, humanities, and languages.',
  },
  {
    number: '02',
    title: 'Choose Papers',
    description: 'Select your tier (Core or Extended) and the specific papers you are sitting this series.',
  },
  {
    number: '03',
    title: 'Enter Marks',
    description: 'Input your estimated raw marks per paper. Component weighting is handled automatically.',
  },
  {
    number: '04',
    title: 'See Your Estimate',
    description: 'Receive a grade estimate with a confidence range derived from five years of Cambridge boundaries for your chosen exam session.',
  },
]

const metrics = [
  {
    value: '18',
    label: 'IGCSE Subjects',
    sub: 'Across sciences, mathematics, humanities, and languages',
  },
  {
    value: '5',
    label: 'Years of Data',
    sub: 'Feb/March, May/June, and Oct/Nov series — pick the one you\'re sitting',
  },
  {
    value: '100%',
    label: 'Component Weighted',
    sub: 'Marks weighted exactly as Cambridge specifies per syllabus',
  },
]

const subjectData = [
  { subject: 'Add. Mathematics', code: '0606', pct: 87 },
  { subject: 'Mathematics', code: '0580', pct: 79 },
  { subject: 'Chemistry', code: '0620', pct: 73 },
  { subject: 'Physics', code: '0625', pct: 70 },
  { subject: 'Economics', code: '0455', pct: 64 },
  { subject: 'English Language', code: '0500', pct: 58 },
]

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/dashboard')
    })
  }, [router])

  return (
    <main className="min-h-screen" style={{ background: '#0C0C0C' }}>
      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5"
        style={{
          borderBottom: '1px solid rgba(42,42,42,0.8)',
          background: 'rgba(12,12,12,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
        }}
      >
        <span className="font-display text-xl tracking-wide" style={{ color: '#F5F5F0' }}>
          Threshold
        </span>
        <div className="flex items-center gap-5">
          <Link
            href="/auth/login"
            className="text-sm transition-opacity hover:opacity-70"
            style={{ color: '#888', fontFamily: 'var(--font-sans)' }}
          >
            Sign in
          </Link>
          <Link href="/estimate">
            <Button size="sm" variant="outline">Estimate</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-8 text-center pt-20 pb-32 relative overflow-hidden">
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(201,169,110,0.07) 0%, transparent 70%)',
          }}
        />
        {/* Decorative corner lines */}
        <div className="absolute top-24 left-8 pointer-events-none hidden lg:block">
          <div style={{ width: 40, height: 1, background: 'rgba(201,169,110,0.2)' }} />
          <div style={{ width: 1, height: 40, background: 'rgba(201,169,110,0.2)', marginTop: -1 }} />
        </div>
        <div className="absolute top-24 right-8 pointer-events-none hidden lg:block">
          <div style={{ width: 40, height: 1, background: 'rgba(201,169,110,0.2)', marginLeft: 'auto' }} />
          <div style={{ width: 1, height: 40, background: 'rgba(201,169,110,0.2)', marginTop: -1, marginLeft: 'auto' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="max-w-3xl mx-auto relative"
        >
          <div className="mb-6 flex items-center justify-center gap-3">
            <div style={{ width: 24, height: 1, background: 'rgba(201,169,110,0.4)' }} />
            <span
              className="text-xs tracking-[0.3em] uppercase"
              style={{ color: '#C9A96E', fontFamily: 'var(--font-sans)' }}
            >
              Cambridge IGCSE
            </span>
            <div style={{ width: 24, height: 1, background: 'rgba(201,169,110,0.4)' }} />
          </div>

          <h1
            className="font-display font-light mb-6"
            style={{ fontSize: 'clamp(52px, 8vw, 96px)', letterSpacing: '-0.02em', lineHeight: 1.05, color: '#F5F5F0' }}
          >
            Know where
            <br />
            <span className="text-gradient-gold italic">you stand.</span>
          </h1>

          <p
            className="text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed"
            style={{ fontFamily: 'var(--font-sans)', color: '#888' }}
          >
            Estimate your IGCSE grades using five years of Cambridge grade
            boundary data — weighted, averaged, and mapped to your marks.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/estimate">
              <Button size="lg" variant="primary">Start Estimating</Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="ghost">Sign in to save results</Button>
            </Link>
          </div>

          {/* Inline stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex items-center justify-center gap-8 sm:gap-12"
          >
            {[
              { value: '18', label: 'subjects' },
              { value: '5 yrs', label: 'boundary data' },
              { value: 'FM·MJ·ON', label: 'all sessions' },
            ].map((stat, i) => (
              <div key={stat.label} className="text-center">
                {i > 0 && (
                  <div
                    className="absolute -left-4 sm:-left-6 top-1/2 -translate-y-1/2 h-6 w-px"
                    style={{ background: '#2A2A2A' }}
                  />
                )}
                <div className="font-display text-2xl font-light relative" style={{ color: '#F5F5F0' }}>
                  {stat.value}
                </div>
                <div className="text-xs tracking-widest uppercase mt-0.5" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-10 flex flex-col items-center gap-2"
        >
          <span
            className="text-xs tracking-widest uppercase"
            style={{ color: '#3D3D3D', fontFamily: 'var(--font-sans)' }}
          >
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-px h-8"
            style={{ background: 'linear-gradient(to bottom, #2A2A2A, transparent)' }}
          />
        </motion.div>
      </section>

      {/* Metrics section */}
      <section style={{ borderTop: '1px solid #2A2A2A', borderBottom: '1px solid #2A2A2A' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3">
          {metrics.map((m, i) => (
            <motion.div
              key={m.value}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="px-10 py-14 flex flex-col justify-center relative"
              style={{
                borderRight: i < 2 ? '1px solid #2A2A2A' : undefined,
                borderBottom: '1px solid transparent',
              }}
            >
              <div
                className="font-display font-light mb-2 leading-none"
                style={{ fontSize: '64px', color: '#C9A96E', letterSpacing: '-0.02em' }}
              >
                {m.value}
              </div>
              <div className="font-display text-lg mb-2" style={{ color: '#F5F5F0' }}>
                {m.label}
              </div>
              <div
                className="text-xs leading-relaxed"
                style={{ color: '#555', fontFamily: 'var(--font-sans)', maxWidth: '200px' }}
              >
                {m.sub}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-28 px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <div className="text-xs tracking-[0.3em] uppercase mb-4" style={{ color: '#C9A96E', fontFamily: 'var(--font-sans)' }}>
              Process
            </div>
            <h2 className="font-display font-light" style={{ fontSize: 'clamp(32px, 5vw, 52px)', color: '#F5F5F0' }}>
              Four steps to clarity
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '1px', background: '#2A2A2A' }}>
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-12 group relative overflow-hidden"
                style={{
                  background: '#0C0C0C',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.02) inset',
                }}
              >
                {/* Large decorative number */}
                <div
                  className="absolute -bottom-4 right-4 font-display font-light select-none pointer-events-none leading-none"
                  style={{ fontSize: '120px', color: 'rgba(255,255,255,0.025)' }}
                >
                  {step.number}
                </div>

                <div className="relative">
                  <div
                    className="text-xs tracking-[0.2em] mb-5"
                    style={{ color: '#C9A96E', fontFamily: 'var(--font-sans)' }}
                  >
                    {step.number}
                  </div>
                  <h3
                    className="font-display text-2xl font-light mb-4"
                    style={{ color: '#F5F5F0' }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: '#888', fontFamily: 'var(--font-sans)' }}
                  >
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology section */}
      <section className="py-28 px-8" style={{ borderTop: '1px solid #2A2A2A' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div
                className="text-xs tracking-[0.3em] uppercase mb-5"
                style={{ color: '#C9A96E', fontFamily: 'var(--font-sans)' }}
              >
                Methodology
              </div>
              <h2
                className="font-display font-light mb-8"
                style={{ fontSize: 'clamp(28px, 4vw, 44px)', color: '#F5F5F0' }}
              >
                Five years of boundaries,
                <br />
                weighted for relevance.
              </h2>
              <p
                className="text-sm leading-relaxed mb-5"
                style={{ color: '#888', fontFamily: 'var(--font-sans)' }}
              >
                Cambridge publishes grade threshold documents for three sessions each year — February/March, May/June, and October/November. You pick the session you&apos;re sitting, and we use the last five years of that session&apos;s boundaries.
              </p>
              <p
                className="text-sm leading-relaxed mb-5"
                style={{ color: '#888', fontFamily: 'var(--font-sans)' }}
              >
                Rather than a simple average, recent years carry more weight — so if boundaries have been shifting, your estimate reflects that trend. We also show you the historical range so you can see how stable or volatile a boundary has been.
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: '#888', fontFamily: 'var(--font-sans)' }}
              >
                Component marks are weighted exactly as Cambridge specifies per syllabus. No approximations.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <div
                className="text-xs uppercase tracking-widest mb-6"
                style={{ color: '#555', fontFamily: 'var(--font-sans)' }}
              >
                A* boundary · Extended tier · MJ series · 5-yr average
              </div>
              <div className="space-y-4">
                {subjectData.map((row, i) => (
                  <motion.div
                    key={row.code}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.25 + i * 0.08, duration: 0.5 }}
                    className="flex items-center gap-4"
                  >
                    <span
                      className="text-xs w-28 flex-shrink-0 truncate"
                      style={{ color: '#555', fontFamily: 'var(--font-sans)' }}
                    >
                      {row.subject}
                    </span>
                    <div className="flex-1 relative" style={{ height: '2px', background: '#1E1E1E', borderRadius: 1 }}>
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ background: 'linear-gradient(to right, #C9A96E, rgba(201,169,110,0.3))' }}
                        initial={{ width: '0%' }}
                        whileInView={{ width: `${row.pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: 0.35 + i * 0.08, ease: 'easeOut' }}
                      />
                    </div>
                    <span
                      className="font-display text-sm w-10 text-right flex-shrink-0"
                      style={{ color: '#C9A96E' }}
                    >
                      {row.pct}%
                    </span>
                  </motion.div>
                ))}
              </div>
              <div
                className="mt-6 pt-5 flex justify-between text-xs"
                style={{ borderTop: '1px solid #1E1E1E', fontFamily: 'var(--font-sans)', color: '#555' }}
              >
                <span>Hardest A*: Add. Maths · 87%</span>
                <span>Easiest A*: English · 58%</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-8" style={{ borderTop: '1px solid #2A2A2A' }}>
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-xs tracking-[0.3em] uppercase mb-5" style={{ color: '#C9A96E', fontFamily: 'var(--font-sans)' }}>
              Get started
            </div>
            <h2
              className="font-display font-light mb-3"
              style={{ fontSize: 'clamp(32px, 5vw, 52px)', color: '#F5F5F0' }}
            >
              Ready to find out?
            </h2>
            <p className="text-sm mb-10" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
              No login required. Estimate in under a minute.
            </p>
            <Link href="/estimate">
              <Button size="lg" variant="primary">Start Estimating</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-14" style={{ borderTop: '1px solid #1E1E1E' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-10">
            <div className="max-w-xs">
              <div className="font-display text-2xl mb-3" style={{ color: '#F5F5F0' }}>
                Threshold
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                Cambridge IGCSE grade estimation built on five years of boundary data across all three exam sessions.
              </p>
            </div>

            <div className="flex gap-16">
              <div>
                <div
                  className="text-xs tracking-widest uppercase mb-4"
                  style={{ color: '#555', fontFamily: 'var(--font-sans)' }}
                >
                  Tool
                </div>
                <div className="space-y-3">
                  <Link
                    href="/estimate"
                    className="block text-sm transition-opacity hover:opacity-70"
                    style={{ color: '#888', fontFamily: 'var(--font-sans)' }}
                  >
                    Estimate grades
                  </Link>
                  <Link
                    href="/auth/login"
                    className="block text-sm transition-opacity hover:opacity-70"
                    style={{ color: '#888', fontFamily: 'var(--font-sans)' }}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block text-sm transition-opacity hover:opacity-70"
                    style={{ color: '#888', fontFamily: 'var(--font-sans)' }}
                  >
                    Create account
                  </Link>
                </div>
              </div>

              <div>
                <div
                  className="text-xs tracking-widest uppercase mb-4"
                  style={{ color: '#555', fontFamily: 'var(--font-sans)' }}
                >
                  Data
                </div>
                <div className="space-y-3">
                  <div className="text-sm" style={{ color: '#888', fontFamily: 'var(--font-sans)' }}>
                    18 IGCSE subjects
                  </div>
                  <div className="text-sm" style={{ color: '#888', fontFamily: 'var(--font-sans)' }}>
                    FM · MJ · ON series
                  </div>
                  <div className="text-sm" style={{ color: '#888', fontFamily: 'var(--font-sans)' }}>
                    Cambridge boundaries
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            style={{ borderTop: '1px solid #1E1E1E' }}
          >
            <span className="font-display text-xs" style={{ color: '#333' }}>
              © 2025 Threshold
            </span>
            <span
              style={{ color: '#333', fontSize: '11px', fontFamily: 'var(--font-sans)', maxWidth: '480px', textAlign: 'right' }}
            >
              Grade estimates are based on historical Cambridge data and are for informational purposes only. Not affiliated with Cambridge Assessment International Education.
            </span>
          </div>
        </div>
      </footer>
    </main>
  )
}
