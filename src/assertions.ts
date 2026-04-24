import type { D1Database } from "@cloudflare/workers-types"

import type { SafeIdentifier } from "./identifier.ts"

type Column = { type: string; notnull: 0 | 1; pk: 0 | 1 }

export const EXPECTED_COLUMNS = {
  applied_at: { notnull: 1, pk: 0, type: "TIMESTAMP" },
  id: { notnull: 0, pk: 1, type: "INTEGER" },
  name: { notnull: 0, pk: 0, type: "TEXT" },
} satisfies Record<string, Column>

type PragmaColumn = {
  cid: number
  dflt_value: string | null
  name: string
  notnull: 0 | 1
  pk: 0 | 1
  type: string
}

export async function assertMigrationsTableSchema(
  database: D1Database,
  tableName: SafeIdentifier,
): Promise<void> {
  const pragmaColumns = (
    await database.prepare(`PRAGMA table_info(${tableName})`).all<PragmaColumn>()
  ).results as PragmaColumn[]

  const actual = new Map(
    pragmaColumns.map((column: PragmaColumn) => [column.name, column] as const),
  )

  for (const [name, expected] of Object.entries(EXPECTED_COLUMNS)) {
    const column = actual.get(name)

    if (!column) {
      throw new Error(`${tableName}.${name} missing`)
    }

    if (column.type.toUpperCase() !== expected.type) {
      throw new Error(`${tableName}.${name} type is ${column.type}, expected ${expected.type}`)
    }

    if (column.notnull !== expected.notnull) {
      throw new Error(
        `${tableName}.${name} notnull is ${column.notnull}, expected ${expected.notnull}`,
      )
    }

    if (column.pk !== expected.pk) {
      throw new Error(`${tableName}.${name} pk is ${column.pk}, expected ${expected.pk}`)
    }
  }

  const unknownColumns = [...actual.keys()].filter((name) => !(name in EXPECTED_COLUMNS))

  if (unknownColumns.length > 0) {
    throw new Error(`${tableName} has unexpected columns: ${unknownColumns.join(", ")}`)
  }
}
