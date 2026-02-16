# Allure Report Guide

## What is Allure?

Allure provides beautiful, interactive test reports with historical trends, flaky test detection, and detailed execution information.

## Features

✅ Historical trends and test history
✅ Flaky test detection
✅ Screenshots, videos, and traces
✅ Test duration trends
✅ Categorization and severity levels
✅ Environment information

## Usage

### 1. Run Tests (generates allure-results)

```bash
npm run test
# or
npm run test:dev
npm run test:chromium
```

### 2. View Reports (3 options)

#### Option A: Quick View (Recommended)

Serve the report directly without generating HTML:

```bash
npm run allure:serve
```

This opens the report in your browser automatically.

#### Option B: Generate and Open

Generate HTML report, then open it:

```bash
npm run allure:generate
npm run allure:open
```

#### Option C: One-time Generation

```bash
npx allure generate reports/allure-results -o reports/allure-report
```

### 3. Clean Old Reports (optional)

```bash
npm run allure:clean
```

## Report Features

### Historical Data

- Run tests multiple times
- Allure automatically tracks history in `reports/allure-report/history`
- Keeps previous run data for trends

### To Preserve History Between Runs:

1. Generate the first report: `npm run allure:generate`
2. Run tests again: `npm run test`
3. Copy history: `cp -r reports/allure-report/history reports/allure-results/`
4. Generate new report: `npm run allure:generate`

### Best Practice for CI/CD:

In your CI pipeline, always copy the history folder from previous builds to maintain trends.

## Report Sections

1. **Overview** - Summary with graphs and trends
2. **Categories** - Categorized failures
3. **Suites** - Organized by test suites
4. **Graphs** - Visual representations
5. **Timeline** - Execution timeline
6. **Behaviors** - BDD-style view
7. **Packages** - Organized by file structure

## Adding Metadata to Tests

### Severity

```typescript
import { test } from '@playwright/test';

test('critical test', async ({ page }) => {
  // @ts-ignore
  await test.info().annotations.push({ type: 'severity', description: 'critical' });
  // test code
});
```

### Description

```typescript
test('patient registration', async ({ page }) => {
  // @ts-ignore
  await test.info().annotations.push({
    type: 'description',
    description: 'This test verifies patient registration flow',
  });
  // test code
});
```

## Troubleshooting

### Report not showing tests?

- Make sure tests ran successfully first
- Check that `reports/allure-results` has JSON files

### History not working?

- Run tests at least twice
- Copy history folder as shown above

### Port already in use?

- Allure uses port 45687 by default
- Close previous instances or specify a different port:
  ```bash
  allure open reports/allure-report -p 8080
  ```

## Links

- [Allure Documentation](https://docs.qameta.io/allure/)
- [Allure Playwright](https://www.npmjs.com/package/allure-playwright)
