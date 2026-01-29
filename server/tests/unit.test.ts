import { describe, it, expect } from 'vitest';
import { VALID_TRANSITIONS } from '@shared/schema';

describe('Campaign State Machine', () => {
    it('should allow valid transitions from AGGREGATION', () => {
        const nextStates = VALID_TRANSITIONS.AGGREGATION;
        expect(nextStates).toContain('SUCCESS');
        expect(nextStates).toContain('FAILED');
        expect(nextStates.length).toBe(2);
    });

    it('should allow valid transitions from SUCCESS', () => {
        const nextStates = VALID_TRANSITIONS.SUCCESS;
        expect(nextStates).toContain('PROCUREMENT');
        expect(nextStates).toContain('FAILED');
        expect(nextStates.length).toBe(2);
    });

    it('should allow valid transitions from PROCUREMENT', () => {
        const nextStates = VALID_TRANSITIONS.PROCUREMENT;
        expect(nextStates).toContain('FULFILLMENT');
        expect(nextStates).toContain('FAILED');
        expect(nextStates.length).toBe(2);
    });

    it('should allow valid transitions from FULFILLMENT', () => {
        const nextStates = VALID_TRANSITIONS.FULFILLMENT;
        expect(nextStates).toContain('COMPLETED');
        expect(nextStates).toContain('FAILED');
        expect(nextStates.length).toBe(2);
    });

    it('should not allow transitions from FAILED state', () => {
        const nextStates = VALID_TRANSITIONS.FAILED;
        expect(nextStates).toEqual([]);
    });

    it('should not allow transitions from COMPLETED state', () => {
        const nextStates = VALID_TRANSITIONS.COMPLETED;
        expect(nextStates).toEqual([]);
    });

    it('should block FULFILLMENT -> AGGREGATION', () => {
        const nextStates = VALID_TRANSITIONS.FULFILLMENT;
        expect(nextStates).not.toContain('AGGREGATION');
    });

    it('should block PROCUREMENT -> SUCCESS (no backwards transitions)', () => {
        const nextStates = VALID_TRANSITIONS.PROCUREMENT;
        expect(nextStates).not.toContain('SUCCESS');
        expect(nextStates).not.toContain('AGGREGATION');
    });

    it('should verify complete state machine coverage', () => {
        const allStates = ['AGGREGATION', 'SUCCESS', 'PROCUREMENT', 'FULFILLMENT', 'COMPLETED', 'FAILED'];
        const transitionKeys = Object.keys(VALID_TRANSITIONS);

        expect(transitionKeys.sort()).toEqual(allStates.sort());
    });
});
