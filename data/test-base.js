//const base = require('@playwright/test');
import base from '@playwright/test';

export const customtest = base.extend({
  testDataForOrder: {
    username: 'anshika@gmail.com',
    password: 'Iamking@000',
    productName: 'ADIDAS ORIGINAL',
  },
});
