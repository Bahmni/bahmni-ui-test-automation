# Bahmni UI Automation

Automated test suite for Bahmni 3.0 UI - includes functional, end-to-end, and visual regression testing using Playwright.

## Prerequisites

- Node.js v18 or higher
- Docker (for running Bahmni locally)
- Bahmni instance running (local or remote)

## Installation

```bash
npm install
```

## Global Setup

The framework includes a global setup that runs before all tests to:

- Verify environment accessibility
- Create necessary concepts, attributes from openMRS which is required for the tests

These prerequisites are automatically created on first run and skipped on subsequent runs if they already exist.

## Project Structure

```
bahmni-ui-automation/
├── src/
│   ├── pages/           # Page Object Models
│   ├── fixtures/        # Test fixtures
│   ├── utils/           # Utility functions
│   └── config/          # Configuration files
├── tests/               # Test specifications
├── test-data/           # Test data files
├── reports/             # Test reports
├── global-setup.ts      # Global setup (runs before all tests)
├── global-teardown.ts   # Global teardown (runs after all tests)
├── playwright.config.ts # Playwright configuration
└── package.json         # Project dependencies
```

## Page Object Model

Page objects are created using the `/page` command with data-test-id attributes prioritized for stable locators.

## Environment Configuration

The project supports multiple environments through `.env` files:

- `.env.local` - For local testing (https://localhost)
- `.env.dev` - For development environment (https://docker.standard.mybahmni.in)

Create above files by using .env.example for your environment.

## SSL Certificate Setup for Local Testing

When testing against a local Bahmni instance with self-signed certificates, you need to extract and trust the SSL certificate.

### Step 1: Extract Certificate from Docker

```bash
docker exec bahmni-standard-proxy-1 cat /etc/tls/cert.pem > /tmp/bahmni-cert.pem
```

### Step 2: Add Certificate to macOS Keychain (macOS only)

```bash
sudo security add-trusted-cert -d -r trustRoot -p ssl -k /Library/Keychains/System.keychain /tmp/bahmni-cert.pem
```

**Note:** The certificate file must remain at `/tmp/bahmni-cert.pem` as the test scripts reference this path.

## Running Tests

```bash
# Run all tests
npm run test:local
# Run all tests in dev env
npm run test:dev
# Run with headed browser
npm run test:headed:local
# Run specific test file
npm run test:local -- tests/sanity.spec.ts --project=chromium
# Run specific browser
npm run test:chromium
npm run test:firefox
```

## Test Reports

### Allure Reports are generated in:

- Allure: `reports/allure-results`

## Code Quality

### Linting

```bash
# Check for lint errors
npm run lint
# Fix lint errors automatically
npm run lint:fix
```

### Formatting

```bash
# Check code formatting
npm run format:check
# Format code
npm run format
```

## Troubleshooting

### SSL Certificate Errors on Local

If you see `TypeError: fetch failed` errors during global setup:

1. Verify the certificate is at `/tmp/bahmni-cert.pem`
2. Ensure Docker container is running: `docker ps | grep bahmni-standard-proxy`
3. Re-extract the certificate if needed
4. Verify `NODE_EXTRA_CA_CERTS` is set in the npm scripts

### Tests Fail to Connect

1. Check if Bahmni is running: `docker ps`
2. Verify BASE_URL in `.env` file matches your instance
3. Test direct access: `curl -k https://localhost` (for local) or `curl https://docker.standard.mybahmni.in` (for dev)

### Browser Not Launching

```bash
npx playwright install
```

## Contributing

1. Follow the existing code style (enforced by ESLint and Prettier)
2. Use data-test-id attributes for locators whenever possible
3. Write descriptive test names
4. Update documentation for new features
5. Run `npm run lint:fix` and `npm run format` before committing

## License

ISC
