import type { D1Database, D1PreparedStatement, D1Result } from "@cloudflare/workers-types"

import { assertMigrationsTableSchema } from "./assertions.ts"
import { SafeIdentifier } from "./identifier.ts"
import type { Migration, MigrationResult } from "./types.ts"

export const DEFAULT_MIGRATIONS_TABLE: SafeIdentifier =
  SafeIdentifier.fromString("d1_migrations")
export const DEFAULT_STATEMENT_SEPARATOR = "--> statement-breakpoint"

type MigrationResultPlanEntry = {
  name: string
  skipped: boolean
  statementCount: number
}

export async function migrate(
  database: D1Database,
  migrations: readonly Migration[],
  tableName: SafeIdentifier = DEFAULT_MIGRATIONS_TABLE,
  statementSeparator = DEFAULT_STATEMENT_SEPARATOR,
): Promise<MigrationResult> {
  await database
    .prepare(
      `CREATE TABLE IF NOT EXISTS ${tableName} (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT UNIQUE,
				applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
			)`,
    )
    .run()

  await assertMigrationsTableSchema(database, tableName)

  const migrationRows = (
    await database.prepare(`SELECT name FROM ${tableName}`).all<{ name: string }>()
  ).results as { name: string }[]

  const done = new Set(migrationRows.map((row: { name: string }) => row.name))

  const statements: D1PreparedStatement[] = []
  const resultPlan: MigrationResultPlanEntry[] = []

  for (const { name, sql } of migrations) {
    if (done.has(name)) {
      resultPlan.push({ name, skipped: true, statementCount: 0 })
      continue
    }

    const migrationStatements = sql
      .split(statementSeparator)
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0)
      .map((statement) => database.prepare(statement))

    statements.push(
      ...migrationStatements,
      database.prepare(`INSERT INTO ${tableName} (name) VALUES (?)`).bind(name),
    )

    resultPlan.push({
      name,
      skipped: false,
      statementCount: migrationStatements.length + 1,
    })

    done.add(name)
  }

  const batchResults: D1Result[] =
    statements.length > 0 ? await database.batch(statements) : []

  let offset = 0

  return resultPlan.map(({ name, skipped, statementCount }) => {
    const results = batchResults.slice(offset, offset + statementCount)
    offset += statementCount

    return { name, results, skipped }
  })
}
