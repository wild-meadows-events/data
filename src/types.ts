import type { D1Result } from "@cloudflare/workers-types"
import { z } from "zod"

export type Migration = {
  name: string
  sql: string
}

export const MigrationResultEntrySchema = z.object({
  name: z.string(),
  results: z.array(z.unknown()),
  skipped: z.boolean(),
})

export const MigrationResultSchema = z.array(MigrationResultEntrySchema)

export type MigrationResultEntry = {
  name: string
  skipped: boolean
  results: D1Result[]
}

export type MigrationResult = MigrationResultEntry[]
