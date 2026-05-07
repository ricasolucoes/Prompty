/* eslint-disable */
/**
 * Polls Supabase Management API for project usage.
 * Exits non-zero (critical) when any tracked metric is >= 90% of free-tier limit.
 * Warns (writes to stdout + ::warning::) at 70%.
 *
 * Required env: SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF
 */

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF
const WARN_PCT = 70
const CRITICAL_PCT = 90

if (!TOKEN || !PROJECT_REF) {
  console.error('Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF')
  process.exit(2)
}

const FREE_LIMITS = {
  db_size_bytes: 500 * 1024 * 1024,
  storage_bytes: 1024 * 1024 * 1024,
  bandwidth_bytes_30d: 5 * 1024 * 1024 * 1024,
  mau: 50_000,
} as const

type UsageMetric = { name: keyof typeof FREE_LIMITS; value: number; limit: number; pct: number }

async function fetchJson(path: string): Promise<unknown> {
  const url = `https://api.supabase.com${path}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`HTTP ${res.status} ${url}: ${body.slice(0, 240)}`)
  }
  return res.json()
}

async function main() {
  const project = (await fetchJson(`/v1/projects/${PROJECT_REF}`)) as { id: string; name: string }
  console.log(`Project: ${project.name} (${project.id})`)

  // Endpoint paths can vary; we try both common shapes:
  //   /v1/projects/{ref}/usage              (aggregate snapshot)
  //   /v1/projects/{ref}/database           (db size)
  //   /v1/projects/{ref}/buckets            (storage size)
  // For free tier the simpler /usage call is preferred.
  let usage: any
  try {
    usage = await fetchJson(`/v1/projects/${PROJECT_REF}/usage`)
  } catch (e) {
    console.error(`::warning::Could not fetch /usage endpoint (${(e as Error).message}). Skipping.`)
    return
  }

  const metrics: UsageMetric[] = []
  function addMetric(name: keyof typeof FREE_LIMITS, value: number) {
    const limit = FREE_LIMITS[name]
    const pct = (value / limit) * 100
    metrics.push({ name, value, limit, pct })
  }

  // Best-effort field extraction; structure may differ. Defensive parsing:
  const u = usage ?? {}
  const dbSize = Number(u?.db_size_bytes ?? u?.database?.size_bytes ?? 0)
  const storageSize = Number(u?.storage_bytes ?? u?.storage?.bytes ?? 0)
  const bandwidth = Number(u?.bandwidth_bytes_30d ?? u?.bandwidth?.bytes ?? 0)
  const mau = Number(u?.mau ?? u?.auth?.mau ?? 0)

  if (dbSize) addMetric('db_size_bytes', dbSize)
  if (storageSize) addMetric('storage_bytes', storageSize)
  if (bandwidth) addMetric('bandwidth_bytes_30d', bandwidth)
  if (mau) addMetric('mau', mau)

  if (metrics.length === 0) {
    console.log('No usage metrics returned by /v1/projects/{ref}/usage. Endpoint may not yet be implemented.')
    return
  }

  let exitCode = 0
  for (const m of metrics) {
    const pretty = `${m.name}: ${m.value} / ${m.limit} (${m.pct.toFixed(1)}%)`
    if (m.pct >= CRITICAL_PCT) {
      console.error(`::error::${pretty} — CRITICAL (>=${CRITICAL_PCT}%)`)
      exitCode = 1
    } else if (m.pct >= WARN_PCT) {
      console.warn(`::warning::${pretty} — WARN (>=${WARN_PCT}%)`)
    } else {
      console.log(`OK: ${pretty}`)
    }
  }
  process.exit(exitCode)
}

main().catch((err) => {
  console.error('Usage check failed:', (err as Error).message)
  process.exit(2)
})
