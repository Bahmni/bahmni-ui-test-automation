import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false, channel: 'chrome' });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  const requests: Array<{ method: string; url: string; body: string | null; status?: number }> = [];

  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/openmrs/') && !url.includes('.js') && !url.includes('.css') && !url.includes('.png')) {
      requests.push({
        method: req.method(),
        url: url.replace(/https?:\/\/[^/]+/, ''),
        body: req.postData() ?? null,
      });
    }
  });

  page.on('response', (res) => {
    const url = res.url();
    if (url.includes('/openmrs/') && !url.includes('.js') && !url.includes('.css') && !url.includes('.png')) {
      const match = requests.find((r) => r.url === url.replace(/https?:\/\/[^/]+/, '') && r.status === undefined);
      if (match) match.status = res.status();
    }
  });

  await page.goto('https://localhost/bahmni/home/index.html#/login');
  console.log('\n=== Browser open. Perform patient registration, then close the browser. ===\n');

  await page.waitForEvent('close', { timeout: 300000 }).catch(() => {});
  await browser.close();

  console.log('\n=== Captured API calls ===\n');
  for (const req of requests) {
    console.log(`${req.method} ${req.url} → ${req.status ?? '?'}`);
    if (req.body) {
      try {
        console.log(JSON.stringify(JSON.parse(req.body), null, 2));
      } catch {
        console.log(req.body.substring(0, 200));
      }
    }
    console.log('---');
  }
})();
