import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const databaseUrl = process.env.NODE_ENV === 'test'
  ? process.env.TEST_DATABASE_URL
  : process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    `${process.env.NODE_ENV === 'test' ? 'TEST_DATABASE_URL' : 'DATABASE_URL'} must be set.`,
  );
}



export const pool = new Pool({
  connectionString: databaseUrl,
});
export const db = drizzle(pool, { schema });
