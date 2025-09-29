import { test as baseTest } from '@playwright/test';

const test = baseTest.extend({
  customData: async ({}, use) => {
    const data = { username: 'superman', password: 'Admin@123' };
    await use(data);
  },
});

export const expect = test.expect;
export default test;
