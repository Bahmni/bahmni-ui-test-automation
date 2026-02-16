import { FullConfig } from '@playwright/test';
import { config } from './src/config/env.config';

/**
 * Check if relationship type exists in OpenMRS
 */
async function checkRelationshipExists(aIsToB: string, bIsToA: string, baseUrl: string): Promise<boolean> {
  const auth = Buffer.from(`${config.users.admin.username}:${config.users.admin.password}`).toString('base64');

  try {
    const response = await fetch(`${baseUrl}/openmrs/ws/rest/v1/relationshiptype?v=full`, {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`  ⚠ Could not check existing relationships: ${response.status}`);
      return false;
    }

    const data = await response.json();
    const exists = data.results?.some(
      (rel: any) => (rel.aIsToB === aIsToB && rel.bIsToA === bIsToA) || (rel.aIsToB === bIsToA && rel.bIsToA === aIsToB)
    );

    return exists;
  } catch (error) {
    console.log(`  ⚠ Error checking relationship: ${error}`);
    return false;
  }
}

/**
 * Create relationship type in OpenMRS
 */
async function createRelationshipType(aIsToB: string, bIsToA: string, baseUrl: string) {
  const auth = Buffer.from(`${config.users.admin.username}:${config.users.admin.password}`).toString('base64');

  // Check if relationship already exists
  const exists = await checkRelationshipExists(aIsToB, bIsToA, baseUrl);

  if (exists) {
    console.log(`  ✓ ${aIsToB}-${bIsToA} already exists (skipped)`);
    return { success: true, skipped: true };
  }

  // Create new relationship type
  try {
    const response = await fetch(`${baseUrl}/openmrs/ws/rest/v1/relationshiptype`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aIsToB,
        bIsToA,
        description: `${aIsToB}-${bIsToA} relationship`,
      }),
    });

    if (response.ok) {
      const data: any = await response.json();
      console.log(`  ✓ Created: ${aIsToB}-${bIsToA} (UUID: ${data.uuid})`);
      return { success: true, uuid: data.uuid };
    } else {
      const errorText = await response.text();
      console.error(`  ✗ Failed to create ${aIsToB}-${bIsToA}: ${errorText}`);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error(`  ✗ Error creating ${aIsToB}-${bIsToA}: ${error}`);
    return { success: false, error: String(error) };
  }
}

/**
 * Setup relationship types required for tests
 */
async function setupRelationshipTypes(baseUrl: string) {
  console.log('Setting up relationship types...');

  const relationships = [
    { aIsToB: 'Father', bIsToA: 'Son' },
    { aIsToB: 'Mother', bIsToA: 'Son' },
    { aIsToB: 'Husband', bIsToA: 'Wife' },
    { aIsToB: 'Elder Sibling', bIsToA: 'Younger Sibling' },
  ];

  for (const rel of relationships) {
    await createRelationshipType(rel.aIsToB, rel.bIsToA, baseUrl);
  }

  console.log('✓ Relationship types setup complete\n');
}

/**
 * Global setup runs once before all test files
 * Use this for:
 * - Verify test prerequisites
 * - Check environment availability
 * - One-time test data setup
 */
async function globalSetup(playwrightConfig: FullConfig) {
  const baseUrl =
    (playwrightConfig as any).use?.baseURL || process.env.BASE_URL || 'https://localhost/bahmni/home/index.html';

  console.log('\n=================================');
  console.log('🚀 Starting Bahmni Test Suite');
  console.log('=================================');
  console.log(`Environment: ${baseUrl}`);
  console.log(`Workers: ${playwrightConfig.workers}`);
  console.log(`Browser: ${playwrightConfig.projects[0]?.name || 'chromium'}`);
  console.log('=================================\n');

  // Verify environment is accessible
  try {
    const https = await import('https');
    const agent = new https.Agent({
      rejectUnauthorized: process.env.IGNORE_HTTPS_ERRORS === 'true' ? false : true,
    });

    const response = await fetch(baseUrl, {
      // @ts-expect-error - agent is valid for https requests
      agent: baseUrl.startsWith('https') ? agent : undefined,
    });

    if (!response.ok) {
      throw new Error(`Environment not accessible: ${response.status}`);
    }
    console.log('✓ Environment is accessible\n');
  } catch {
    console.log('⚠ Could not verify environment accessibility (SSL/Network issue)');
    console.log('Continuing with test setup...\n');
    // Don't throw - allow tests to proceed
  }

  // Setup relationship types
  await setupRelationshipTypes(baseUrl);
}

export default globalSetup;
