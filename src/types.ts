import type { D1Result } from "@cloudflare/workers-types"
import { type ZodArray, type ZodObject, type ZodUnknown, z } from "zod"

export type Migration = {
  name: string
  sql: string
}

type MigrationResultEntrySchemaShape = {
  name: ReturnType<typeof z.string>
  results: ZodArray<ZodUnknown>
  skipped: ReturnType<typeof z.boolean>
}

type MigrationResultEntrySchema = ZodObject<MigrationResultEntrySchemaShape>

export const MigrationResultEntrySchema: MigrationResultEntrySchema = z.object({
  name: z.string(),
  results: z.array(z.unknown()),
  skipped: z.boolean(),
})

export const MigrationResultSchema: ZodArray<MigrationResultEntrySchema> = z.array(
  MigrationResultEntrySchema,
)

export type MigrationResultEntry = {
  name: string
  skipped: boolean
  results: D1Result[]
}

export type MigrationResult = MigrationResultEntry[]
