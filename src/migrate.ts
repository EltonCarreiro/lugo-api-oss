import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL ?? '', { max: 1 });

const db = drizzle(sql);

const run = async () => {
  await migrate(db, { migrationsFolder: 'migrations' });
  await sql.end();
};

run();
