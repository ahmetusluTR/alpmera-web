import { pool } from '../db';
import { log } from '../log';

async function reset() {
    if (process.env.NODE_ENV !== 'test') {
        console.error('Refusing to reset non-test database!');
        process.exit(1);
    }

    log('Resetting test database...');

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
        await pool.query(`TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE`);
        log('Test database reset successful.');
        process.exit(0);
    } catch (err) {
        console.error('Database reset failed:', err);
        process.exit(1);
    }
}

reset();
