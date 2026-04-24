import type { D1Database } from "@cloudflare/workers-types"

import { assertMigrationsTableSchema } from "./assertions.ts"
import { SafeIdentifier } from "./identifier.ts"
import type { Migration, MigrationResult } from "./types.ts"

export const DEFAULT_MIGRATIONS_TABLE: SafeIdentifier = SafeIdentifier.fromString("d1_migrations")
export const DEFAULT_STATEMENT_SEPARATOR = "--> statement-breakpoint"

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
  const applied: string[] = []
  const skipped: string[] = []

  for (const { name, sql } of migrations) {
    if (done.has(name)) {
      skipped.push(name)
      continue
    }

    const statements = sql
      .split(statementSeparator)
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0)
      .map((statement) => database.prepare(statement))

    await database.batch([
      ...statements,
      database.prepare(`INSERT INTO ${tableName} (name) VALUES (?)`).bind(name),
    ])

    applied.push(name)
  }

  return { applied, skipped }
}
