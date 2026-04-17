import { test as base, request } from '@playwright/test';
import { ApiFactory } from '../ApiFactory';

type ApiFixtures = {
  api: ApiFactory;
};

export const test = base.extend<object, ApiFixtures>({
  api: [
    async ({}, use) => {
      const apiContext = await request.newContext({
        ignoreHTTPSErrors: true,
      });
      await use(new ApiFactory(apiContext));
      await apiContext.dispose();
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';
