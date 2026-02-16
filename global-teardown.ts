import { FullConfig } from '@playwright/test';

/**
 * Global teardown runs once after all test files complete
 * Use this for:
 * - Cleanup test data
 * - Generate final reports
 * - Close connections
 */
async function globalTeardown(_config: FullConfig) {
  console.log('\n=================================');
  console.log('🏁 Test Suite Completed');
  console.log('=================================');
  console.log('Check reports in:');
  console.log('  - Allure: reports/allure-results');
  console.log('  - HTML: reports/html-report');
  console.log('  - JSON: reports/test-results.json');
  console.log('=================================\n');

  // Add cleanup logic here:
  // - Delete temporary test data
  // - Close database connections
  // - Archive test artifacts
}

export default globalTeardown;
