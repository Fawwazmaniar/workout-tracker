import { describe, expect, it } from 'vitest';
import { formatPerformedAt } from './format';

describe('formatPerformedAt', () => {
  it('formats an ISO timestamp with weekday, month and year', () => {
    const text = formatPerformedAt('2025-03-15T12:00:00Z');
    expect(text).toMatch(/Mar/);
    expect(text).toMatch(/2025/);
  });

  it('returns the original value when it is not a valid date', () => {
    expect(formatPerformedAt('not a date')).toBe('not a date');
  });
});
