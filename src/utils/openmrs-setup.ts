import { FullConfig } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { config } from '../config/env.config';

interface RoleDefinition {
  uuid?: string;
  name: string;
  username?: string;
  description: string;
  inheritedRoles: string[];
  privileges: string[];
}

/**
 * Parse a single CSV line respecting double-quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parse roles.csv — columns: Uuid, Role name, Username, Description, Inherited roles, Privileges
 * Inherited roles and Privileges are semicolon-separated within each cell
 */
function parseRolesCSV(filePath: string): RoleDefinition[] {
  const lines = readFileSync(filePath, 'utf-8')
    .split('\n')
    .filter((line) => line.trim());

  return lines
    .slice(1) // skip header
    .map((line) => parseCSVLine(line))
    .filter((cols) => cols.length >= 2 && cols[1])
    .map((cols) => ({
      uuid: cols[0] || undefined,
      name: cols[1],
      username: cols[2] || undefined,
      description: cols[3] || '',
      inheritedRoles: cols[4]
        ? cols[4]
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      privileges: cols[5]
        ? cols[5]
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    }));
}

/**
 * Build a username → password map by scanning all USER_*_USERNAME / USER_*_PASSWORD env pairs
 */
function buildPasswordMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const key of Object.keys(process.env)) {
    if (key.startsWith('USER_') && key.endsWith('_USERNAME')) {
      const prefix = key.slice(0, -'_USERNAME'.length);
      const username = process.env[key];
      const password = process.env[`${prefix}_PASSWORD`];
      if (username && password) map.set(username, password);
    }
  }
  return map;
}

/**
 * Fetch all existing OpenMRS usernames in a single API call
 */
async function fetchExistingUsernames(baseUrl: string, auth: string): Promise<Set<string>> {
  try {
    const response = await fetch(`${baseUrl}/openmrs/ws/rest/v1/user?v=full`, {
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    });
    if (!response.ok) return new Set();
    const data = await response.json();
    return new Set((data.results ?? []).map((u: any) => u.username).filter(Boolean));
  } catch {
    return new Set();
  }
}

/**
 * Fetch the person UUID for an existing OpenMRS user by username.
 */
async function fetchUserPersonUuid(username: string, baseUrl: string, auth: string): Promise<string | null> {
  try {
    const response = await fetch(`${baseUrl}/openmrs/ws/rest/v1/user?username=${username}&v=full`, {
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    });
    if (!response.ok) return null;
    const data = await response.json();
    const user = data.results?.find((u: any) => u.username === username);
    return user?.person?.uuid ?? null;
  } catch {
    return null;
  }
}

/**
 * Check whether a Provider record already exists for the given identifier (username).
 */
async function providerExistsForPerson(identifier: string, baseUrl: string, auth: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/openmrs/ws/rest/v1/provider?q=${identifier}&v=default`, {
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    });
    if (!response.ok) return false;
    const data = await response.json();
    return (data.results ?? []).some((p: { identifier?: string }) => p.identifier === identifier);
  } catch {
    return false;
  }
}

/**
 * Create a Provider record linked to the given person UUID.
 * Required for users whose role (or inherited roles) includes Provider.
 */
async function createProvider(identifier: string, personUuid: string, baseUrl: string, auth: string): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/openmrs/ws/rest/v1/provider`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, person: personUuid, retired: false }),
    });
    if (response.ok) {
      const data: any = await response.json();
      console.log(`    ↳ Provider record created for "${identifier}" (UUID: ${data.uuid})`);
    } else {
      const errorText = await response.text();
      console.warn(`    ↳ ⚠ Could not create provider for "${identifier}": ${errorText}`);
    }
  } catch (error) {
    console.warn(`    ↳ ⚠ Error creating provider for "${identifier}": ${error}`);
  }
}

/**
 * Create an OpenMRS user assigned to the given role (referenced by UUID).
 * Returns the person UUID on success so a Provider record can be created if needed.
 */
async function createUser(
  username: string,
  password: string,
  roleName: string,
  roleUuid: string,
  baseUrl: string,
  auth: string
): Promise<{ success: boolean; personUuid?: string; error?: string }> {
  try {
    const response = await fetch(`${baseUrl}/openmrs/ws/rest/v1/user`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        person: {
          names: [{ givenName: username, familyName: 'User' }],
          gender: 'M',
        },
        roles: [{ uuid: roleUuid }],
      }),
    });

    if (response.ok) {
      const data: any = await response.json();
      console.log(`  ✓ Created user "${username}" with role "${roleName}" (UUID: ${data.uuid})`);
      return { success: true, personUuid: data.person?.uuid };
    } else {
      const errorText = await response.text();
      console.error(`  ✗ Failed to create user "${username}": ${errorText}`);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error(`  ✗ Error creating user "${username}": ${error}`);
    return { success: false, error: String(error) };
  }
}

/**
 * Setup OpenMRS users from test-data/roles.csv (rows that have a Username value).
 * Fetches all existing users and role UUIDs once, then only creates missing ones.
 * Passwords are resolved from USER_*_USERNAME / USER_*_PASSWORD env pairs.
 */
async function setupUsers(roles: RoleDefinition[], baseUrl: string) {
  console.log('Setting up users...');

  const auth = Buffer.from(`${config.users.admin.username}:${config.users.admin.password}`).toString('base64');
  const existingUsernames = await fetchExistingUsernames(baseUrl, auth);
  const { uuidByName: roleUuidByName, providerRoles } = await fetchExistingRoles(baseUrl, auth);
  const passwordMap = buildPasswordMap();

  for (const role of roles.filter((r) => r.username)) {
    const username = role.username!;
    if (existingUsernames.has(username)) {
      console.log(`  ✓ User "${username}" already exists (skipped)`);
      const personUuid = await fetchUserPersonUuid(username, baseUrl, auth);
      if (personUuid && !(await providerExistsForPerson(username, baseUrl, auth))) {
        await createProvider(username, personUuid, baseUrl, auth);
      }
      continue;
    }
    const password = passwordMap.get(username);
    if (!password) {
      console.warn(`  ⚠ No password found for user "${username}" — skipping (add USER_*_PASSWORD to .env)`);
      continue;
    }
    const roleUuid = roleUuidByName.get(role.name);
    if (!roleUuid) {
      console.warn(`  ⚠ Could not find UUID for role "${role.name}" — skipping user "${username}"`);
      continue;
    }
    const result = await createUser(username, password, role.name, roleUuid, baseUrl, auth);
    if (result.success && result.personUuid && providerRoles.has(role.name)) {
      await createProvider(username, result.personUuid, baseUrl, auth);
    }
  }

  console.log('✓ User setup complete\n');
}

/**
 * Fetch all existing OpenMRS roles in a single API call.
 * Returns a map of role name → UUID, a set of existing names, and a set of role names
 * that inherit from the built-in "Provider" role (these users need a Provider record).
 */
async function fetchExistingRoles(
  baseUrl: string,
  auth: string
): Promise<{ names: Set<string>; uuidByName: Map<string, string>; providerRoles: Set<string> }> {
  try {
    const response = await fetch(`${baseUrl}/openmrs/ws/rest/v1/role?v=full`, {
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    });
    if (!response.ok) return { names: new Set(), uuidByName: new Map(), providerRoles: new Set() };
    const data = await response.json();
    const names = new Set<string>();
    const uuidByName = new Map<string, string>();
    const providerRoles = new Set<string>();

    for (const r of data.results ?? []) {
      const name = r.display ?? r.name;
      if (name) {
        names.add(name);
        if (r.uuid) uuidByName.set(name, r.uuid);
        const inheritsProvider = r.inheritedRoles?.some((ir: any) => (ir.display ?? ir.name) === 'Provider');
        if (inheritsProvider) providerRoles.add(name);
      }
    }
    return { names, uuidByName, providerRoles };
  } catch {
    return { names: new Set(), uuidByName: new Map(), providerRoles: new Set() };
  }
}

/**
 * Create a single role in OpenMRS
 */
async function createRole(
  role: RoleDefinition,
  baseUrl: string,
  auth: string
): Promise<{ success: boolean; error?: string }> {
  const body: Record<string, unknown> = {
    name: role.name,
    description: role.description,
    privileges: role.privileges.map((p) => ({ privilege: p })),
    inheritedRoles: role.inheritedRoles.map((r) => ({ name: r })),
  };
  if (role.uuid) body.uuid = role.uuid;

  try {
    const response = await fetch(`${baseUrl}/openmrs/ws/rest/v1/role`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const data: any = await response.json();
      console.log(`  ✓ Created role "${role.name}" (UUID: ${data.uuid})`);
      return { success: true };
    } else {
      const errorText = await response.text();
      console.error(`  ✗ Failed to create role "${role.name}": ${errorText}`);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error(`  ✗ Error creating role "${role.name}": ${error}`);
    return { success: false, error: String(error) };
  }
}

/**
 * Sync any privileges in the CSV that are missing from an existing role in OpenMRS.
 */
async function syncRolePrivileges(
  role: RoleDefinition,
  roleUuid: string,
  baseUrl: string,
  auth: string
): Promise<void> {
  try {
    const res = await fetch(`${baseUrl}/openmrs/ws/rest/v1/role/${roleUuid}?v=full`, {
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) return;
    const data = await res.json();
    const existing = new Set<string>((data.privileges ?? []).map((p: any) => p.display ?? p.name));
    const missing = role.privileges.filter((p) => !existing.has(p));
    if (missing.length === 0) return;

    const updated = [
      ...(data.privileges ?? []).map((p: any) => ({ privilege: p.display ?? p.name })),
      ...missing.map((p) => ({ privilege: p })),
    ];
    const update = await fetch(`${baseUrl}/openmrs/ws/rest/v1/role/${roleUuid}`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ privileges: updated }),
    });
    if (update.ok) {
      console.log(`  ✓ Role "${role.name}" synced — added: ${missing.join(', ')}`);
    } else {
      console.warn(`  ⚠ Could not sync privileges for "${role.name}"`);
    }
  } catch {
    console.warn(`  ⚠ Error syncing privileges for "${role.name}"`);
  }
}

/**
 * Setup OpenMRS roles from test-data/roles.csv.
 * Creates missing roles and syncs any new privileges onto existing ones.
 * Uses multiple passes to handle roles that inherit from other roles in the same CSV.
 * Returns the parsed role definitions for use by setupUsers.
 */
async function setupRoles(baseUrl: string): Promise<RoleDefinition[]> {
  console.log('Setting up roles...');

  const auth = Buffer.from(`${config.users.admin.username}:${config.users.admin.password}`).toString('base64');
  const csvPath = resolve(process.cwd(), 'test-data/roles.csv');
  const roles = parseRolesCSV(csvPath);
  const { names: existingRoles, uuidByName } = await fetchExistingRoles(baseUrl, auth);

  // For existing roles sync any missing privileges; collect new roles to create
  const syncPromises: Promise<void>[] = [];
  let pending = roles.filter((r) => {
    if (existingRoles.has(r.name)) {
      const uuid = uuidByName.get(r.name);
      if (uuid) syncPromises.push(syncRolePrivileges(r, uuid, baseUrl, auth));
      else console.log(`  ✓ Role "${r.name}" already exists (skipped)`);
      return false;
    }
    return true;
  });
  await Promise.all(syncPromises);

  // Up to 3 passes so roles that depend on other CSV roles are retried after dependencies are created
  const MAX_PASSES = 3;
  for (let pass = 1; pass <= MAX_PASSES && pending.length > 0; pass++) {
    if (pass > 1) console.log(`  Re-trying ${pending.length} role(s) (pass ${pass})...`);

    const failed: RoleDefinition[] = [];
    for (const role of pending) {
      const result = await createRole(role, baseUrl, auth);
      if (!result.success) failed.push(role);
    }
    pending = failed;
  }

  if (pending.length > 0) {
    console.warn(`  ⚠ Could not create role(s): ${pending.map((r) => r.name).join(', ')}`);
  }

  console.log('✓ Role setup complete\n');
  return roles;
}

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

  // Allow self-signed certificates for all Node.js fetch calls (same as ignoreHTTPSErrors in browser)
  if (process.env.IGNORE_HTTPS_ERRORS === 'true') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

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

  // Setup roles from test-data/roles.csv, then create users assigned to those roles
  const roles = await setupRoles(baseUrl);
  await setupUsers(roles, baseUrl);

  // Setup relationship types
  await setupRelationshipTypes(baseUrl);
}

export default globalSetup;
