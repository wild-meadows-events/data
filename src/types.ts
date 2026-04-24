import type { D1Result } from "@cloudflare/workers-types"

export type Migration = {
  name: string
  sql: string
}

export type MigrationResultEntry = {
  name: string
  skipped: boolean
  results: readonly D1Result[]
}

export type MigrationResult = readonly MigrationResultEntry[]
