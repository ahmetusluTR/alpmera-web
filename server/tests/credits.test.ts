import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../db';
import { users, creditLedgerEntries } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { storage } from '../storage';

describe('Credits System - Phase 1.5', () => {
  const TEST_USER_ID = 'test_credits_user_001';
  const TEST_USER_EMAIL = 'test-credits@example.com';

  beforeAll(async () => {
    // Create test user
    await db.insert(users).values({
      id: TEST_USER_ID,
      email: TEST_USER_EMAIL,
      phoneNumber: '+15555551234',
    }).onConflictDoNothing();
  });

  afterAll(async () => {
    // Cleanup test data
    await db.delete(creditLedgerEntries).where(eq(creditLedgerEntries.participantId, TEST_USER_ID));
    await db.delete(users).where(eq(users.id, TEST_USER_ID));
  });

  describe('Credit Summary Aggregation', () => {
    it('should correctly compute participant credit breakdown', async () => {
      // Setup: Create test credit entries
      const testEntries = [
        {
          participantId: TEST_USER_ID,
          eventType: 'ISSUED' as const,
          amount: '100.00',
          currency: 'USD',
          reason: 'Test credit issuance 1',
          createdBy: 'TEST_SYSTEM',
          idempotencyKey: `test:issued:${TEST_USER_ID}:001`,
        },
        {
          participantId: TEST_USER_ID,
          eventType: 'ISSUED' as const,
          amount: '50.00',
          currency: 'USD',
          reason: 'Test credit issuance 2',
          createdBy: 'TEST_SYSTEM',
          idempotencyKey: `test:issued:${TEST_USER_ID}:002`,
        },
        {
          participantId: TEST_USER_ID,
          eventType: 'RESERVED' as const,
          amount: '-30.00',
          currency: 'USD',
          reservationRef: 'test_reservation_001',
          reason: 'Test credit reservation',
          createdBy: 'TEST_SYSTEM',
        },
        {
          participantId: TEST_USER_ID,
          eventType: 'APPLIED' as const,
          amount: '0.00',
          currency: 'USD',
          reservationRef: 'test_reservation_002',
          reason: 'Test credit application',
          createdBy: 'TEST_SYSTEM',
        },
      ];

      await db.insert(creditLedgerEntries).values(testEntries);

      // Execute: Get participant credit summary
      const summary = await storage.getParticipantCreditSummary(TEST_USER_ID);

      // Verify: Check all breakdown values
      expect(summary.participantId).toBe(TEST_USER_ID);
      expect(summary.participantEmail).toBe(TEST_USER_EMAIL);
      expect(summary.currency).toBe('USD');

      // Total Balance = SUM(amount) = 100 + 50 - 30 + 0 = 120
      expect(parseFloat(summary.totalBalance)).toBe(120.00);

      // Lifetime Earned = SUM(ISSUED) = 100 + 50 = 150
      expect(parseFloat(summary.breakdown.lifetimeEarned)).toBe(150.00);

      // Currently Reserved = 30.00 (RESERVED without matching RELEASED)
      expect(parseFloat(summary.breakdown.currentlyReserved)).toBe(30.00);

      // Available Balance = Total - Reserved = 120 - 30 = 90
      expect(parseFloat(summary.breakdown.availableBalance)).toBe(90.00);

      // Lifetime Spent = Earned - Total = 150 - 120 = 30
      expect(parseFloat(summary.breakdown.lifetimeSpent)).toBe(30.00);
    });

    it('should handle participant with no credit entries', async () => {
      const nonExistentUserId = 'test_nonexistent_user';

      // Create user but no credit entries
      await db.insert(users).values({
        id: nonExistentUserId,
        email: 'nonexistent@example.com',
        phoneNumber: '+15555559999',
      }).onConflictDoNothing();

      const summary = await storage.getParticipantCreditSummary(nonExistentUserId);

      // All values should be zero
      expect(parseFloat(summary.totalBalance)).toBe(0);
      expect(parseFloat(summary.breakdown.lifetimeEarned)).toBe(0);
      expect(parseFloat(summary.breakdown.currentlyReserved)).toBe(0);
      expect(parseFloat(summary.breakdown.availableBalance)).toBe(0);
      expect(parseFloat(summary.breakdown.lifetimeSpent)).toBe(0);

      // Cleanup
      await db.delete(users).where(eq(users.id, nonExistentUserId));
    });
  });

  describe('Idempotency Constraint', () => {
    it('should enforce unique idempotency keys', async () => {
      const idempotencyKey = `test:idempotency:${TEST_USER_ID}:unique`;

      // First insert should succeed
      await db.insert(creditLedgerEntries).values({
        participantId: TEST_USER_ID,
        eventType: 'ISSUED',
        amount: '25.00',
        currency: 'USD',
        reason: 'Test idempotency enforcement',
        createdBy: 'TEST_SYSTEM',
        idempotencyKey,
      });

      // Second insert with same key should fail
      let errorOccurred = false;
      try {
        await db.insert(creditLedgerEntries).values({
          participantId: TEST_USER_ID,
          eventType: 'ISSUED',
          amount: '50.00', // Different amount
          currency: 'USD',
          reason: 'Duplicate idempotency key attempt',
          createdBy: 'TEST_SYSTEM',
          idempotencyKey, // Same key
        });
      } catch (error: any) {
        errorOccurred = true;
        // Verify it's a unique constraint violation
        expect(error.code).toBe('23505'); // PostgreSQL unique violation
        expect(error.constraint).toBe('credit_ledger_idempotency_key_idx');
      }

      expect(errorOccurred).toBe(true);
    });

    it('should retrieve entry by idempotency key', async () => {
      const idempotencyKey = `test:idempotency:${TEST_USER_ID}:retrieve`;

      // Create entry
      await db.insert(creditLedgerEntries).values({
        participantId: TEST_USER_ID,
        eventType: 'ISSUED',
        amount: '75.00',
        currency: 'USD',
        reason: 'Test idempotency retrieval',
        createdBy: 'TEST_SYSTEM',
        idempotencyKey,
      });

      // Retrieve by idempotency key
      const retrieved = await storage.getCreditLedgerEntryByIdempotencyKey(idempotencyKey);

      expect(retrieved).toBeDefined();
      expect(retrieved?.participantId).toBe(TEST_USER_ID);
      expect(retrieved?.amount).toBe('75.00');
      expect(retrieved?.idempotencyKey).toBe(idempotencyKey);
    });

    it('should return undefined for non-existent idempotency key', async () => {
      const nonExistentKey = 'test:idempotency:nonexistent:key';

      const retrieved = await storage.getCreditLedgerEntryByIdempotencyKey(nonExistentKey);

      expect(retrieved).toBeUndefined();
    });
  });

  describe('Credit Ledger Append-Only Integrity', () => {
    it('should allow INSERT operations', async () => {
      const entry = {
        participantId: TEST_USER_ID,
        eventType: 'ISSUED' as const,
        amount: '10.00',
        currency: 'USD',
        reason: 'Test append-only insert',
        createdBy: 'TEST_SYSTEM',
        idempotencyKey: `test:append:${TEST_USER_ID}:insert`,
      };

      const result = await db.insert(creditLedgerEntries).values(entry).returning();

      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe('10.00');
    });

    it('should verify entries are stored as expected', async () => {
      const testKey = `test:verify:${TEST_USER_ID}:storage`;

      await db.insert(creditLedgerEntries).values({
        participantId: TEST_USER_ID,
        eventType: 'RESERVED',
        amount: '-5.00',
        currency: 'USD',
        reason: 'Test storage verification',
        createdBy: 'TEST_SYSTEM',
        idempotencyKey: testKey,
        reservationRef: 'test_reservation_verify',
      });

      const [stored] = await db
        .select()
        .from(creditLedgerEntries)
        .where(eq(creditLedgerEntries.idempotencyKey, testKey));

      expect(stored).toBeDefined();
      expect(stored.eventType).toBe('RESERVED');
      expect(stored.amount).toBe('-5.00');
      expect(stored.reservationRef).toBe('test_reservation_verify');
    });
  });

  describe('Credit Event Types', () => {
    it('should support all 6 event types', async () => {
      const eventTypes = ['ISSUED', 'RESERVED', 'RELEASED', 'APPLIED', 'REVOKED', 'EXPIRED'] as const;

      for (const eventType of eventTypes) {
        const result = await db.insert(creditLedgerEntries).values({
          participantId: TEST_USER_ID,
          eventType,
          amount: '1.00',
          currency: 'USD',
          reason: `Test ${eventType} event type`,
          createdBy: 'TEST_SYSTEM',
          idempotencyKey: `test:event:${TEST_USER_ID}:${eventType.toLowerCase()}`,
        }).returning();

        expect(result).toHaveLength(1);
        expect(result[0].eventType).toBe(eventType);
      }
    });
  });
});
