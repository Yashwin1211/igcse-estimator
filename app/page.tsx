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
    description: 'Choose from 17 Cambridge IGCSE subjects with their syllabus codes.',
  },
  {
    number: '02',
    title: 'Choose Papers',
    description: 'Select your tier and the specific papers you are sitting.',
  },
  {
    number: '03',
    title: 'Enter Marks',
    description: 'Input your raw marks per paper. We handle the weighting.',
  },
  {
    number: '04',
    title: 'See Your Estimate',
    description: 'Get a grade estimate with confidence ranges from 5 years of boundaries.',
  },
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
          background: 'rgba(12,12,12,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
        }}
      >
        <span className="font-display text-lg tracking-wide" style={{ color: '#F5F5F0' }}>
          Threshold
        </span>
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="text-sm transition-colors"
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
      <section className="min-h-screen flex flex-col items-center justify-center px-8 text-center pt-20 relative">
        {/* Subtle radial glow behind hero text */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 45%, rgba(201,169,110,0.06) 0%, transparent 70%)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="max-w-3xl mx-auto relative"
        >
          <div className="mb-6">
            <span
              className="text-xs tracking-[0.3em] uppercase"
              style={{ color: '#C9A96E', fontFamily: 'var(--font-sans)' }}
            >
              Cambridge IGCSE
            </span>
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
            className="text-lg md:text-xl mb-12 max-w-xl mx-auto leading-relaxed"
            style={{ fontFamily: 'var(--font-sans)', color: '#888' }}
          >
            Estimate your IGCSE grades using five years of Cambridge grade
            boundary data — weighted, averaged, and mapped to your marks.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/estimate">
              <Button size="lg" variant="primary">Start Estimating</Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="ghost">Sign in to save results</Button>
            </Link>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-12 flex flex-col items-center gap-2"
        >
          <span
            className="text-xs tracking-widest uppercase"
            style={{ color: '#555', fontFamily: 'var(--font-sans)' }}
          >
            How it works
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-px h-8"
            style={{ background: 'linear-gradient(to bottom, #2A2A2A, transparent)' }}
          />
        </motion.div>
      </section>

      {/* How it works */}
      <section className="py-32 px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="font-display font-light mb-4" style={{ fontSize: 'clamp(32px, 5vw, 52px)', color: '#F5F5F0' }}>
              Four steps to clarity
            </h2>
            <p style={{ color: '#888', fontFamily: 'var(--font-sans)' }}>
              No login required. Start estimating in under a minute.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '1px', background: '#2A2A2A' }}>
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-10 group"
                style={{
                  background: '#0C0C0C',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.02) inset',
                }}
              >
                <div
                  className="text-xs tracking-[0.2em] mb-4"
                  style={{ color: '#C9A96E', fontFamily: 'var(--font-sans)' }}
                >
                  {step.number}
                </div>
                <h3 className="font-display text-2xl font-light mb-3 transition-all duration-300" style={{ color: '#F5F5F0' }}>
                  {step.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: '#888', fontFamily: 'var(--font-sans)' }}
                >
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8" style={{ borderTop: '1px solid #2A2A2A' }}>
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display font-light mb-6" style={{ fontSize: 'clamp(28px, 4vw, 44px)', color: '#F5F5F0' }}>
              Ready to find out?
            </h2>
            <Link href="/estimate">
              <Button size="lg" variant="primary">Start Estimating</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 flex items-center justify-between" style={{ borderTop: '1px solid #1E1E1E' }}>
        <span style={{ color: '#555', fontSize: '12px', fontFamily: 'var(--font-sans)' }}>
          Grade estimates are based on historical Cambridge data. For informational purposes only.
        </span>
        <span className="font-display text-sm" style={{ color: '#555' }}>Threshold</span>
      </footer>
    </main>
  )
}
