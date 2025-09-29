import { test } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

test('run lighthouse audit on a specific page', async ({ page }) => {
  // Navigate to the target page
  await page.goto(
    'https://demo.standard.mybahmni.in/bahmni/home/index.html#/loginLocation',
  );

  // Wait for the page to be fully loaded (optional, but recommended)
  await page.waitForLoadState('networkidle');

  // Define the output path for the Lighthouse report
  const reportPath = path.join(__dirname, 'lighthouse-report.json');

  // Construct the Lighthouse CLI command
  const lighthouseCommand = `lighthouse ${page.url()} --output=html --output-path=${reportPath}`;

  // Execute the command synchronously
  try {
    execSync(lighthouseCommand, { stdio: 'inherit' });
    console.log(`Lighthouse audit completed. Report saved at: ${reportPath}`);
  } catch (error) {
    console.error('Lighthouse audit failed:', error);
    throw error;
  }
});

test('parse and validate lighthouse report', async () => {
  const reportPath = path.join(__dirname, 'lighthouse-report.json');

  // Read the JSON file synchronously
  const rawData = fs.readFileSync(reportPath, 'utf8');

  // Parse the JSON string into a JavaScript object
  const lighthouseReport = JSON.parse(rawData);

  // Now, you can access and validate values from the object
  // For example, get the Performance score
  const performanceScore = lighthouseReport.categories.performance.score * 100;
  console.log(`Performance Score: ${performanceScore}`);

  // Assert that the performance score is above a certain threshold
  expect(performanceScore).toBeGreaterThanOrEqual(90);

  // You can also get other metrics
  const lcpScore =
    lighthouseReport.audits['largest-contentful-paint'].score * 100;
  console.log(`LCP Score: ${lcpScore}`);

  // To get a specific metric value (in milliseconds)
  const lcpValue =
    lighthouseReport.audits['largest-contentful-paint'].numericValue;
  console.log(`LCP Value (ms): ${lcpValue}`);

  // Example of finding a diagnostic value (Total Byte Weight)
  const totalByteWeight =
    lighthouseReport.audits['total-byte-weight'].numericValue;
  console.log(`Total Page Size (bytes): ${totalByteWeight}`);

  // Example of finding a specific opportunity or diagnostic item
  const networkRequests =
    lighthouseReport.audits['network-requests'].details.items;
  const jsRequests = networkRequests.filter(
    (item) => item.resourceType === 'Script',
  );
  console.log(`Number of JS requests: ${jsRequests.length}`);

  // You can now iterate over the `jsRequests` array to inspect details of each script.
});
