import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.TEST_DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL not set");
}

export default defineConfig({
    out: "./migrations",
    schema: "./shared/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.TEST_DATABASE_URL + (process.env.TEST_DATABASE_URL.includes('?') ? '&' : '?') + 'options=-c%20search_path%3Dtest',
    },
    // This pushes into whatever schema the connection defaults to
    // But we want to ensure it targets 'test'
    schemaFilter: ["test"],
});
