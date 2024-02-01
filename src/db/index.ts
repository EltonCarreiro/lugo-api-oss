import { PostgresJsQueryResultHKT, drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/schema';
import { PgTransaction } from 'drizzle-orm/pg-core';
import { ExtractTablesWithRelations } from 'drizzle-orm';

const sql = postgres(process.env.DATABASE_URL ?? '');

export const db = drizzle(sql, { schema });

export type DbInstance = typeof db;

export type DbTransaction = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;
