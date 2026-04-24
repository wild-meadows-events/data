export type Migration = {
  name: string
  sql: string
}

export type MigrationResult = {
  applied: string[]
  skipped: string[]
}
