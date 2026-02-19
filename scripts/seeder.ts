/**
 * seeder.ts
 *
 * Reads:
 *   - Subject config JSON files from data/subjects/
 *   - Parsed threshold JSON from scripts/parsed/thresholds.json
 *
 * Upserts everything into the Supabase database.
 * Safe to run multiple times — all operations are upserts.
 *
 * Requires environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import type { SubjectConfig } from '@/types'
import type { ParsedThreshold, ParsedComponent } from './parser.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR   = join(__dirname, '..', 'data', 'subjects')
const PARSED_DIR = join(__dirname, 'parsed')

// Use service role key — bypasses RLS for seeding
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seedSubjects(): Promise<Record<string, string>> {
  console.log('\n── Seeding subjects & papers ──')

  const files = readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'))
  const subjectCodeToId: Record<string, string> = {}

  for (const file of files) {
    const config: SubjectConfig = JSON.parse(
      readFileSync(join(DATA_DIR, file), 'utf-8')
    )

    // Upsert subject
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .upsert(
        { syllabus_code: config.code, name: config.name, has_tiers: config.has_tiers },
        { onConflict: 'syllabus_code' }
      )
      .select('id')
      .single()

    if (subjectError || !subject) {
      console.error(`  ERROR upserting subject ${config.code}: ${subjectError?.message}`)
      continue
    }

    subjectCodeToId[config.code] = subject.id

    // Delete existing papers then re-insert — avoids PostgreSQL NULL uniqueness issues
    await supabase.from('papers').delete().eq('subject_id', subject.id)

    const paperRows = config.papers.map((p) => ({
      subject_id:        subject.id,
      paper_number:      p.paper_number,
      name:              p.name,
      tier:              p.tier ?? null,
      is_ums:            p.is_ums,
      max_raw_mark:      p.max_raw_mark,
      max_ums_mark:      p.max_ums_mark ?? null,
      weight_percentage: p.weight_percentage,
    }))

    const { error: papersError } = await supabase.from('papers').insert(paperRows)

    if (papersError) {
      console.error(`  ERROR inserting papers for ${config.code}: ${papersError.message}`)
    } else {
      console.log(`  ✓ ${config.name} (${config.code}) — ${config.papers.length} papers`)
    }
  }

  return subjectCodeToId
}

async function seedThresholds(subjectCodeToId: Record<string, string>) {
  console.log('\n── Seeding overall grade thresholds ──')

  const thresholdsPath = join(PARSED_DIR, 'thresholds.json')

  if (!existsSync(thresholdsPath)) {
    console.log('  No parsed thresholds found. Run pnpm pipeline:parse first.')
    return
  }

  const rows: ParsedThreshold[] = JSON.parse(readFileSync(thresholdsPath, 'utf-8'))

  // Upsert series records
  const seriesMap: Record<string, string> = {}
  const uniqueSeries = [...new Set(rows.map((r) => `${r.season}_${r.year}`))]

  for (const key of uniqueSeries) {
    const [season, yearStr] = key.split('_')
    const { data, error } = await supabase
      .from('series')
      .upsert({ year: parseInt(yearStr), season }, { onConflict: 'year,season' })
      .select('id')
      .single()

    if (error || !data) {
      console.error(`  ERROR upserting series ${key}: ${error?.message}`)
      continue
    }
    seriesMap[key] = data.id
  }

  let seeded  = 0
  let skipped = 0

  for (const row of rows) {
    const subjectId = subjectCodeToId[row.syllabus_code]
    if (!subjectId) { skipped++; continue }

    const seriesId = seriesMap[`${row.season}_${row.year}`]
    if (!seriesId) { skipped++; continue }

    const gradeRows = row.grades.map((g) => ({
      subject_id: subjectId,
      series_id:  seriesId,
      tier:       row.tier,
      grade:      g.grade,
      min_mark:   g.min_mark,
      max_mark:   row.max_mark,
    }))

    const { error } = await supabase
      .from('subject_thresholds')
      .upsert(gradeRows, { onConflict: 'subject_id,series_id,tier,grade' })

    if (error) {
      console.error(`  ERROR: ${row.syllabus_code} ${row.year} ${row.tier ?? 'no-tier'}: ${error.message}`)
    } else {
      seeded++
    }
  }

  console.log(`  ✓ ${seeded} threshold rows seeded`)
  if (skipped > 0) console.log(`  ⚠ ${skipped} rows skipped (subject not in DB)`)
}

async function updatePaperMaxMarks(subjectCodeToId: Record<string, string>) {
  const componentsPath = join(PARSED_DIR, 'components.json')
  if (!existsSync(componentsPath)) return

  console.log('\n── Updating paper max marks from component data ──')

  const components: ParsedComponent[] = JSON.parse(readFileSync(componentsPath, 'utf-8'))

  // Aggregate: for each subject+paper_number, take the mark from the most recent year
  const latestByPaper: Record<string, { year: number; max_mark: number }> = {}
  for (const c of components) {
    const key = `${c.syllabus_code}_${c.paper_number}`
    const existing = latestByPaper[key]
    if (!existing || c.year > existing.year) {
      latestByPaper[key] = { year: c.year, max_mark: c.max_mark }
    }
  }

  let updated = 0
  for (const [key, { max_mark }] of Object.entries(latestByPaper)) {
    const [code, paperNum] = key.split('_')
    const subjectId = subjectCodeToId[code]
    if (!subjectId || paperNum === '0') continue  // skip coursework components

    const { error } = await supabase
      .from('papers')
      .update({ max_raw_mark: max_mark })
      .eq('subject_id', subjectId)
      .eq('paper_number', paperNum)

    if (!error) updated++
  }

  console.log(`  ✓ ${updated} paper max marks updated from threshold documents`)
}

async function main() {
  console.log('Starting database seed...')

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing environment variables. Create a .env.local file with:')
    console.error('  NEXT_PUBLIC_SUPABASE_URL')
    console.error('  SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const subjectCodeToId = await seedSubjects()
  await seedThresholds(subjectCodeToId)
  await updatePaperMaxMarks(subjectCodeToId)

  console.log('\nSeed complete.')
}

main().catch(console.error)
