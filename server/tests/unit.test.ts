import { describe, it, expect } from 'vitest';
import { VALID_TRANSITIONS } from '@shared/schema';

describe('Campaign State Machine', () => {
    it('should allow valid transitions from AGGREGATION', () => {
        const nextStates = VALID_TRANSITIONS.AGGREGATION;
        expect(nextStates).toContain('SUCCESS');
        expect(nextStates).toContain('FAILED');
        expect(nextStates.length).toBe(2);
    });

    it('should not allow transitions from FAILED state', () => {
        const nextStates = VALID_TRANSITIONS.FAILED;
        expect(nextStates).toEqual([]);
    });

    it('should block FULFILLMENT -> AGGREGATION', () => {
        const nextStates = VALID_TRANSITIONS.FULFILLMENT;
        expect(nextStates).not.toContain('AGGREGATION');
    });
});
