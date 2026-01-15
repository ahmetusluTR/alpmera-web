import 'dotenv/config';
import { beforeAll, beforeEach, afterAll } from 'vitest';
import { pool } from '../db';

// Clean up all tables safely
async function truncateTables() {
    const tables = [
        'escrow_ledger',
        'commitments',
        'supplier_acceptances',
        'admin_action_logs',
        'campaign_admin_events',
        'campaigns',
        'products',
        'suppliers',
        'consolidation_points',
        'user_profiles',
        'user_sessions',
        'auth_codes',
        'users',
        'idempotency_keys',
        'session'
    ];

    try {
        // Truncate all tables and restart identities
        const prefixedTables = tables.map(t => `test.${t}`);
        await pool.query(`TRUNCATE TABLE ${prefixedTables.join(', ')} RESTART IDENTITY CASCADE`);
    } catch (err) {
        console.error('Failed to truncate tables in setup:', err);
    }
}

beforeAll(async () => {
    // PREFLIGHT CHECK 1: Environment Isolation
    if (process.env.NODE_ENV !== 'test') {
        throw new Error('FATAL: Test setup detected non-test environment! Aborting to protect production/dev data.');
    }


    if (!process.env.TEST_DATABASE_URL) {
        throw new Error('FATAL: TEST_DATABASE_URL not set. Automated tests require a dedicated test database.');
    }

    // PREFLIGHT CHECK 2: Schema Isolation
    try {
        // Explicitly set search_path for the test session
        // This is necessary for Supabase poolers that might ignore connection 'options'
        await pool.query('SET search_path TO test');

        const schemaRes = await pool.query('SELECT current_schema() as schema');
        const currentSchema = schemaRes.rows[0]?.schema;
        if (currentSchema !== 'test') {
            throw new Error(`FATAL: Test runner connected to schema "${currentSchema}", but MUST use "test" schema for isolation.`);
        }
    } catch (err: any) {
        throw new Error(`FATAL: Failed to verify database schema isolation: ${err.message}`);
    }
});

beforeEach(async () => {
    await truncateTables();
});

afterAll(async () => {
    await pool.end();
});
