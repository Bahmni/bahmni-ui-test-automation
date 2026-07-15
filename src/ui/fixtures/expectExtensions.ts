// Custom expect matchers — single source imported by both fixtures (re-export) and actions (direct), so all four fixtures pick up the same matcher set.
import { expect as baseExpect } from '@playwright/test';

export const expect = baseExpect.extend({
  toContainItemMatching(received: string[], expected: string) {
    const match = received.some((item) => item.toLowerCase().includes(expected.toLowerCase()));
    return {
      pass: match,
      message: () =>
        match
          ? `Expected list not to contain item matching "${expected}", but found it in: [${received.join(', ')}]`
          : `Expected list to contain item matching "${expected}", but got: [${received.join(', ')}]`,
    };
  },
});
