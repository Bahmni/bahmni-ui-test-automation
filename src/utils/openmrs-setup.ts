import { FullConfig } from '@playwright/test';
import { readFileSync, writeFileSync } from 'fs';
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

interface OpenMRSUser {
  uuid: string;
  username: string;
  person?: { uuid: string };
}

interface OpenMRSRole {
  uuid: string;
  display?: string;
  name?: string;
  inheritedRoles?: Array<{ display?: string; name?: string }>;
  privileges?: Array<{ display?: string; name?: string }>;
}

interface OpenMRSRelationship {
  aIsToB: string;
  bIsToA: string;
}

interface OpenMRSResultSet<T> {
  results: T[];
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
    return new Set((data as OpenMRSResultSet<OpenMRSUser>).results.map((u) => u.username).filter(Boolean));
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
    const user = (data as OpenMRSResultSet<OpenMRSUser>).results?.find((u) => u.username === username);
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
      const data = (await response.json()) as { uuid: string };
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
      const data = (await response.json()) as OpenMRSUser;
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
    const username = role.username as string;
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

    for (const r of (data as OpenMRSResultSet<OpenMRSRole>).results ?? []) {
      const name = r.display ?? r.name;
      if (name) {
        names.add(name);
        if (r.uuid) uuidByName.set(name, r.uuid);
        const inheritsProvider = r.inheritedRoles?.some((ir) => (ir.display ?? ir.name) === 'Provider');
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
      const data = (await response.json()) as { uuid: string };
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
    const existing = new Set<string>(((data as OpenMRSRole).privileges ?? []).map((p) => p.display ?? p.name));
    const missing = role.privileges.filter((p) => !existing.has(p));
    if (missing.length === 0) return;

    const updated = [
      ...((data as OpenMRSRole).privileges ?? []).map((p) => ({ privilege: p.display ?? p.name })),
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
  const csvPath = resolve(process.cwd(), 'test-data/common/roles.csv');
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
    const exists = (data as OpenMRSResultSet<OpenMRSRelationship>).results?.some(
      (rel) => (rel.aIsToB === aIsToB && rel.bIsToA === bIsToA) || (rel.aIsToB === bIsToA && rel.bIsToA === aIsToB)
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
      const data = (await response.json()) as { uuid: string };
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
 * Write a key=value pair into .env.local, creating or updating the line in place.
 */
function writeEnvVar(envPath: string, key: string, value: string): void {
  const envContent = readFileSync(envPath, 'utf-8');
  const updated = envContent.includes(`${key}=`)
    ? envContent.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`)
    : `${envContent}\n${key}=${value}`;
  writeFileSync(envPath, updated);
}

/**
 * Resolve the identifierType UUID from the configured identifier source and inject it
 * into process.env and .env.local so workers pick it up at test runtime.
 */
async function setupIdentifierSource(baseUrl: string): Promise<void> {
  const auth = Buffer.from(`${config.users.admin.username}:${config.users.admin.password}`).toString('base64');
  const envPath = resolve(process.cwd(), '.env.local');

  try {
    // Fetch all identifier sources and use the first active sequential generator
    const listResponse = await fetch(`${baseUrl}/openmrs/ws/rest/v1/idgen/identifiersource?v=full`, {
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    });

    if (!listResponse.ok) {
      console.warn(`  ⚠ Could not fetch identifier sources: ${listResponse.status}`);
      return;
    }

    const listData = await listResponse.json();
    const sources =
      (listData as { results: Array<{ uuid: string; prefix?: string; identifierType?: { uuid?: string } }> }).results ??
      [];
    const source = sources[0];

    if (!source) {
      console.warn(`  ⚠ No identifier sources found on server`);
      return;
    }

    process.env.IDENTIFIER_SOURCE_UUID = source.uuid;
    writeEnvVar(envPath, 'IDENTIFIER_SOURCE_UUID', source.uuid);

    if (source.prefix) {
      process.env.IDENTIFIER_PREFIX = source.prefix;
      writeEnvVar(envPath, 'IDENTIFIER_PREFIX', source.prefix);
    }

    const identifierTypeUuid = source.identifierType?.uuid;
    if (identifierTypeUuid) {
      process.env.IDENTIFIER_TYPE_UUID = identifierTypeUuid;
      writeEnvVar(envPath, 'IDENTIFIER_TYPE_UUID', identifierTypeUuid);
    }

    console.log(`  ✓ Identifier source resolved — UUID: ${source.uuid}, identifierType: ${identifierTypeUuid}`);
  } catch (error) {
    console.warn(`  ⚠ Error fetching identifier source: ${error}`);
  }
}

/**
 * Resolve person attribute type UUIDs by display name and inject them into
 * process.env and .env.local so workers pick them up at test runtime.
 */
async function setupPersonAttributeTypes(baseUrl: string): Promise<void> {
  const auth = Buffer.from(`${config.users.admin.username}:${config.users.admin.password}`).toString('base64');

  try {
    const response = await fetch(`${baseUrl}/openmrs/ws/rest/v1/personattributetype?v=full`, {
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.warn(`  ⚠ Could not fetch person attribute types: ${response.status}`);
      return;
    }

    const data = await response.json();
    const byName = new Map<string, string>();
    for (const attr of (data as { results: { uuid: string; display: string }[] }).results ?? []) {
      byName.set(attr.display.toLowerCase(), attr.uuid);
    }

    const envPath = resolve(process.cwd(), '.env.local');
    const mappings: Array<{ envKey: string; name: string }> = [
      { envKey: 'PERSON_ATTR_PHONE_NUMBER', name: 'phonenumber' },
      { envKey: 'PERSON_ATTR_ALT_PHONE_NUMBER', name: 'alternatephonenumber' },
      { envKey: 'PERSON_ATTR_EMAIL', name: 'email' },
    ];

    for (const { envKey, name } of mappings) {
      const uuid = byName.get(name);
      if (uuid) {
        process.env[envKey] = uuid;
        writeEnvVar(envPath, envKey, uuid);
        console.log(`  ✓ ${name} attribute type UUID: ${uuid}`);
      } else {
        console.warn(`  ⚠ Person attribute type "${name}" not found on server`);
      }
    }
  } catch (error) {
    console.warn(`  ⚠ Error fetching person attribute types: ${error}`);
  }
}

/**
 * Resolve order type UUIDs (Lab, Radiology, Procedure) used as FHIR ServiceRequest categories.
 * These are order types, not concepts, so they're fetched from /ordertype.
 */
async function setupOrderTypes(baseUrl: string): Promise<void> {
  const auth = Buffer.from(`${config.users.admin.username}:${config.users.admin.password}`).toString('base64');
  const envPath = resolve(process.cwd(), '.env.local');

  try {
    const response = await fetch(`${baseUrl}/openmrs/ws/rest/v1/ordertype?v=default`, {
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.warn(`  ⚠ Could not fetch order types: ${response.status}`);
      return;
    }

    const data = await response.json();
    const types = (data as { results: { uuid: string; display: string }[] }).results ?? [];

    const mappings: Array<{ envKey: string; matchName: string }> = [
      { envKey: 'SERVICE_REQUEST_CATEGORY_LAB', matchName: 'lab' },
      { envKey: 'SERVICE_REQUEST_CATEGORY_RADIOLOGY', matchName: 'radiology' },
      { envKey: 'SERVICE_REQUEST_CATEGORY_PROCEDURE', matchName: 'procedure' },
    ];

    for (const { envKey, matchName } of mappings) {
      const match = types.find((t) => t.display.toLowerCase().includes(matchName));
      if (match) {
        process.env[envKey] = match.uuid;
        writeEnvVar(envPath, envKey, match.uuid);
        console.log(`  ✓ Order type "${match.display}" UUID: ${match.uuid}`);
      } else {
        console.warn(`  ⚠ Order type not found for "${matchName}"`);
      }
    }
  } catch (error) {
    console.warn(`  ⚠ Error fetching order types: ${error}`);
  }
}

/**
 * Resolve encounter type UUIDs by name and inject them into process.env and .env.local.
 */
async function setupEncounterTypes(baseUrl: string): Promise<void> {
  const auth = Buffer.from(`${config.users.admin.username}:${config.users.admin.password}`).toString('base64');

  try {
    const response = await fetch(`${baseUrl}/openmrs/ws/rest/v1/encountertype?v=default`, {
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.warn(`  ⚠ Could not fetch encounter types: ${response.status}`);
      return;
    }

    const data = await response.json();
    const byName = new Map<string, string>();
    for (const et of (data as { results: { uuid: string; display: string }[] }).results ?? []) {
      byName.set(et.display.toLowerCase(), et.uuid);
    }

    const envPath = resolve(process.cwd(), '.env.local');
    const consultation = byName.get('consultation');
    if (consultation) {
      process.env.ENCOUNTER_TYPE_CONSULTATION = consultation;
      writeEnvVar(envPath, 'ENCOUNTER_TYPE_CONSULTATION', consultation);
      console.log(`  ✓ Consultation encounter type UUID: ${consultation}`);
    } else {
      console.warn(`  ⚠ "Consultation" encounter type not found on server`);
    }
  } catch (error) {
    console.warn(`  ⚠ Error fetching encounter types: ${error}`);
  }
}

/**
 * Resolve all remaining concept UUIDs used by tests (allergy, lab, vitals, H&E, conditions, etc.).
 * Strategy: try direct UUID lookup first (works for CIEL concepts), fall back to display-name search.
 */
async function setupConcepts(baseUrl: string): Promise<void> {
  const auth = Buffer.from(`${config.users.admin.username}:${config.users.admin.password}`).toString('base64');
  const envPath = resolve(process.cwd(), '.env.local');

  async function lookupByUuid(uuid: string): Promise<string | undefined> {
    try {
      const response = await fetch(`${baseUrl}/openmrs/ws/rest/v1/concept/${uuid}?v=default`, {
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) return undefined;
      const data = await response.json();
      return (data as { uuid?: string }).uuid;
    } catch {
      return undefined;
    }
  }

  async function searchByName(searchName: string, matchName: string): Promise<string | undefined> {
    try {
      const response = await fetch(
        `${baseUrl}/openmrs/ws/rest/v1/concept?q=${encodeURIComponent(searchName)}&v=default&limit=10`,
        { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' } }
      );
      if (!response.ok) return undefined;
      const data = await response.json();
      const results = (data as { results: { uuid: string; display: string }[] }).results ?? [];
      return results.find((c) => c.display.toLowerCase().includes(matchName.toLowerCase()))?.uuid;
    } catch {
      return undefined;
    }
  }

  async function resolveConceptUuid(
    cielUuid: string | undefined,
    searchName: string,
    matchName?: string
  ): Promise<string | undefined> {
    if (cielUuid) {
      const found = await lookupByUuid(cielUuid);
      if (found) return found;
    }
    const byName = await searchByName(searchName, matchName ?? searchName);
    if (byName) return byName;
    // Fall back to the CIEL UUID — it may still work in the FHIR layer even if
    // the REST concept search doesn't index it on this environment.
    return cielUuid;
  }

  const conceptMappings: Array<{ envKey: string; cielUuid?: string; searchName: string; matchName?: string }> = [
    // Duration units
    { envKey: 'DURATION_UNIT_MINUTES', cielUuid: '1733AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', searchName: 'Minutes' },
    { envKey: 'DURATION_UNIT_HOURS', cielUuid: '1822AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', searchName: 'Hours' },
    { envKey: 'DURATION_UNIT_DAYS', cielUuid: '1072AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', searchName: 'Days' },
    { envKey: 'DURATION_UNIT_WEEKS', cielUuid: '1073AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', searchName: 'Weeks' },
    { envKey: 'DURATION_UNIT_MONTHS', cielUuid: '1074AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', searchName: 'Months' },
    // NOTE: SERVICE_REQUEST_CATEGORY_* are resolved from order types, not concepts — handled separately
    // Lab concepts
    {
      envKey: 'LAB_CONCEPT_HAEMOGLOBIN',
      cielUuid: '161432AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'Haemoglobin',
      matchName: 'haemoglobin',
    },
    {
      envKey: 'LAB_CONCEPT_PLATELET_COUNT',
      cielUuid: '159896AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'Platelet count',
      matchName: 'platelet count',
    },
    {
      envKey: 'LAB_CONCEPT_ANEMIA_PANEL',
      cielUuid: '161437AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'Anemia panel',
      matchName: 'anemia panel',
    },
    {
      envKey: 'LAB_CONCEPT_ABSOLUTE_IMMATURE_CELL_COUNT',
      cielUuid: '1335AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'Absolute reticulocyte',
      matchName: 'absolute',
    },
    {
      envKey: 'LAB_CONCEPT_COMPLETE_BLOOD_COUNT',
      cielUuid: '1019AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'Complete blood count',
      matchName: 'complete blood count',
    },
    {
      envKey: 'LAB_CONCEPT_SICKLE_CELL',
      cielUuid: '160225AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'Sickle cell screening',
      matchName: 'sickle cell',
    },
    {
      envKey: 'LAB_CONCEPT_PERIPHERAL_SMEAR',
      cielUuid: '161423AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'Peripheral smear',
      matchName: 'peripheral smear',
    },
    {
      envKey: 'LAB_CONCEPT_HEMOGLOBIN_ELECTROPHORESIS',
      cielUuid: '161421AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'Hemoglobin electrophoresis',
      matchName: 'hemoglobin electrophoresis',
    },
    {
      envKey: 'LAB_CONCEPT_HIV_TEST',
      cielUuid: '1356AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'HIV test',
      matchName: 'hiv test',
    },
    // Radiology
    {
      envKey: 'RADIOLOGY_CONCEPT_ECHOCARDIOGRAM',
      cielUuid: '159567AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'Echocardiogram',
      matchName: 'echocardiogram',
    },
    {
      envKey: 'RADIOLOGY_CONCEPT_XRAY_SKULL',
      cielUuid: '161339AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'X-ray of skull',
      matchName: 'skull',
    },
    {
      envKey: 'RADIOLOGY_CONCEPT_XRAY_ARM',
      cielUuid: '377AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'X-ray, arm',
      matchName: 'x-ray, arm',
    },
    // Procedure
    {
      envKey: 'PROCEDURE_CONCEPT_RECONSTRUCTION',
      cielUuid: '166790AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'Reconstruction procedure',
      matchName: 'reconstruction',
    },
    // Vitals
    { envKey: 'VITALS_CONCEPT_PULSE', cielUuid: '5087AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', searchName: 'Pulse' },
    {
      envKey: 'VITALS_CONCEPT_SPO2',
      cielUuid: '5092AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'oxygen saturation',
      matchName: 'oxygen saturation',
    },
    {
      envKey: 'VITALS_CONCEPT_RESPIRATORY_RATE',
      cielUuid: '5242AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'Respiratory rate',
    },
    { envKey: 'VITALS_CONCEPT_TEMPERATURE', searchName: 'Temperature', matchName: 'temperature' },
    {
      envKey: 'VITALS_CONCEPT_BP_SYSTOLIC',
      cielUuid: '5085AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'Systolic blood pressure',
      matchName: 'systolic',
    },
    {
      envKey: 'VITALS_CONCEPT_BP_DIASTOLIC',
      cielUuid: '5086AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'Diastolic blood pressure',
      matchName: 'diastolic',
    },
    {
      envKey: 'VITALS_CONCEPT_BP_BODY_POSITION',
      cielUuid: '159633AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'blood pressure position',
      matchName: 'blood pressure',
    },
    { envKey: 'VITALS_CONCEPT_BP_GROUP', searchName: 'Blood pressure', matchName: 'blood pressure' },
    // H&E
    {
      envKey: 'HE_CONCEPT_CHIEF_COMPLAINT_GROUP',
      searchName: 'Chief Complaint Record',
      matchName: 'chief complaint record',
    },
    { envKey: 'HE_CONCEPT_CHIEF_COMPLAINT', searchName: 'Chief Complaint Coded', matchName: 'chief complaint coded' },
    {
      envKey: 'HE_CONCEPT_DURATION',
      cielUuid: '1731AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'Sign/symptom duration',
      matchName: 'sign/symptom duration',
    },
    {
      envKey: 'HE_CONCEPT_DURATION_UNIT',
      searchName: 'Chief Complaint Duration',
      matchName: 'chief complaint duration',
    },
    {
      envKey: 'HE_CONCEPT_HISTORY_OF_ILLNESS',
      cielUuid: '1390AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'History of present illness',
      matchName: 'history of present illness',
    },
    // Allergy codes
    {
      envKey: 'ALLERGY_CODE_PENICILLIN',
      cielUuid: '162543AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'Penicillin',
      matchName: 'penicillin',
    },
    {
      envKey: 'ALLERGY_CODE_ASPIRIN',
      cielUuid: '71617AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'Aspirin',
      matchName: 'aspirin',
    },
    {
      envKey: 'ALLERGY_REACTION_CODE_RASH',
      cielUuid: '121629AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'Rash',
      matchName: 'rash',
    },
    // Allergy value sets
    {
      envKey: 'ALLERGY_VALUE_SET_FOOD',
      cielUuid: '162552AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'food allergen',
      matchName: 'food',
    },
    {
      envKey: 'ALLERGY_VALUE_SET_MEDICATION',
      cielUuid: '162553AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'drug allergen',
      matchName: 'drug',
    },
    {
      envKey: 'ALLERGY_VALUE_SET_ENVIRONMENT',
      cielUuid: '162554AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'environmental allergen',
      matchName: 'environmental',
    },
    {
      envKey: 'ALLERGY_VALUE_SET_BIOLOGIC',
      cielUuid: '162555AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'biologic allergen',
      matchName: 'biologic',
    },
    // Condition codes
    {
      envKey: 'CONDITION_CODE_MALARIA',
      cielUuid: '940AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'Malaria',
      matchName: 'malaria',
    },
    {
      envKey: 'CONDITION_CODE_ANAEMIA',
      cielUuid: '145119AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'Anaemia',
      matchName: 'anaemia',
    },
    // FHIR coded values
    {
      envKey: 'CODED_VALUE_FEVER',
      cielUuid: '140238AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'Fever',
      matchName: 'fever',
    },
    {
      envKey: 'CODED_VALUE_HOURS',
      cielUuid: '1822AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'Hours',
      matchName: 'hours',
    },
    {
      envKey: 'CODED_VALUE_SITTING',
      cielUuid: '159630AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      searchName: 'Sitting',
      matchName: 'sitting',
    },
  ];

  let resolved = 0;
  for (const { envKey, cielUuid, searchName, matchName } of conceptMappings) {
    const uuid = await resolveConceptUuid(cielUuid, searchName, matchName);
    if (uuid) {
      process.env[envKey] = uuid;
      writeEnvVar(envPath, envKey, uuid);
      resolved++;
    } else {
      console.warn(`  ⚠ Concept not found: "${searchName}"`);
    }
  }
  console.log(`  ✓ Concepts resolved (${resolved}/${conceptMappings.length})`);
}

/**
 * Search OpenMRS drugs by name and return results sorted by display name.
 */
async function searchDrugs(
  baseUrl: string,
  auth: string,
  query: string,
  limit = 10
): Promise<Array<{ uuid: string; display: string }>> {
  try {
    const response = await fetch(
      `${baseUrl}/openmrs/ws/rest/v1/drug?q=${encodeURIComponent(query)}&v=default&limit=${limit}`,
      { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' } }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return (data as { results: { uuid: string; display: string }[] }).results ?? [];
  } catch {
    return [];
  }
}

function findDrug(
  drugs: Array<{ uuid: string; display: string }>,
  keywords: string[]
): { uuid: string; display: string } | undefined {
  return drugs.find((d) => keywords.some((k) => d.display.toLowerCase().includes(k)));
}

/**
 * Resolve drug UUIDs by searching the concept dictionary.
 * Uses keyword matching to find the right formulation; falls back to first result.
 * Writes resolved UUIDs to .env.local so workers can use them.
 */
async function setupDrugs(baseUrl: string): Promise<void> {
  const auth = Buffer.from(`${config.users.admin.username}:${config.users.admin.password}`).toString('base64');
  const envPath = resolve(process.cwd(), '.env.local');

  const drugSearches: Array<{
    envKey: string;
    query: string;
    keywords: string[];
    fallbackIndex: number;
  }> = [
    {
      envKey: 'DRUG_ACETAMINOPHEN_TABLET',
      query: 'acetaminophen',
      keywords: ['tablet', '500', '650', 'mg'],
      fallbackIndex: 0,
    },
    {
      envKey: 'DRUG_ACETAMINOPHEN_INJECTION',
      query: 'acetaminophen',
      keywords: ['injection', 'ml', 'solution'],
      fallbackIndex: 1,
    },
    {
      envKey: 'DRUG_ACETAMINOPHEN_SUPPOSITORY',
      query: 'acetaminophen',
      keywords: ['suppository', '80', '125', '170'],
      fallbackIndex: 2,
    },
    {
      envKey: 'DRUG_ANTI_RABIES_VACCINE',
      query: 'rabies',
      keywords: ['vaccine', 'anti-rabies', 'antirabies', 'rabies'],
      fallbackIndex: 0,
    },
    { envKey: 'DRUG_INSULIN', query: 'insulin', keywords: ['insulin'], fallbackIndex: 0 },
    { envKey: 'DRUG_ISOFLURANE', query: 'isoflurane', keywords: ['isoflurane'], fallbackIndex: 0 },
    {
      envKey: 'DRUG_NITROGLYCERIN',
      query: 'nitroglycerin',
      keywords: ['nitroglycerin', 'glyceryl trinitrate'],
      fallbackIndex: 0,
    },
    {
      envKey: 'DRUG_ORAL_REHYDRATION_SALTS',
      query: 'oral rehydration',
      keywords: ['oral rehydration', 'ors'],
      fallbackIndex: 0,
    },
    { envKey: 'DRUG_XYLOMETAZOLINE', query: 'xylometazoline', keywords: ['xylometazoline'], fallbackIndex: 0 },
    {
      envKey: 'DRUG_LIDOCAINE_GEL',
      query: 'lidocaine',
      keywords: ['gel', 'jelly', '2%', '4%', 'lidocaine'],
      fallbackIndex: 0,
    },
    {
      envKey: 'DRUG_CLOTRIMAZOLE_PESSARY',
      query: 'clotrimazole',
      keywords: ['pessary', '100', 'clotrimazole'],
      fallbackIndex: 0,
    },
    { envKey: 'DRUG_THIOPENTAL', query: 'thiopental', keywords: ['thiopental', 'thiopentone'], fallbackIndex: 0 },
    {
      envKey: 'DRUG_AMOXICILLIN_CAPSULE',
      query: 'amoxicillin',
      keywords: ['capsule', '500', '250 mg', 'amoxicillin'],
      fallbackIndex: 0,
    },
    { envKey: 'DRUG_DILTIAZEM', query: 'diltiazem', keywords: ['diltiazem'], fallbackIndex: 0 },
    { envKey: 'DRUG_EPINEPHRINE', query: 'epinephrine', keywords: ['epinephrine', 'adrenaline'], fallbackIndex: 0 },
  ];

  let resolved = 0;
  // Cache search results per query to avoid duplicate API calls
  const cache = new Map<string, Array<{ uuid: string; display: string }>>();

  for (const { envKey, query, keywords, fallbackIndex } of drugSearches) {
    if (!cache.has(query)) {
      cache.set(query, await searchDrugs(baseUrl, auth, query));
    }
    const drugs = cache.get(query)!;
    const match = findDrug(drugs, keywords) ?? drugs[fallbackIndex];

    if (match) {
      process.env[envKey] = match.uuid;
      writeEnvVar(envPath, envKey, match.uuid);
      resolved++;
    } else {
      console.warn(`  ⚠ Drug not found for "${query}" (${envKey})`);
    }
  }
  console.log(`  ✓ Drugs resolved (${resolved}/${drugSearches.length})`);
}

/**
 * Resolve drug order frequency constants to OrderFrequency UUIDs.
 * Drug order frequencies must be OrderFrequency UUIDs, not concept UUIDs.
 */
async function setupOrderFrequencies(baseUrl: string): Promise<void> {
  const auth = Buffer.from(`${config.users.admin.username}:${config.users.admin.password}`).toString('base64');
  const envPath = resolve(process.cwd(), '.env.local');

  try {
    const response = await fetch(`${baseUrl}/openmrs/ws/rest/v1/orderfrequency?v=default&limit=100`, {
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.warn(`  ⚠ Could not fetch order frequencies: ${response.status}`);
      return;
    }

    const data = await response.json();
    const freqs = (data as { results: { uuid: string; display: string; concept?: { uuid: string } }[] }).results ?? [];
    // The FHIR MedicationRequest timing code uses the OrderFrequency's concept UUID, not the OrderFrequency UUID itself
    const byDisplay = new Map(freqs.map((f) => [f.display.toLowerCase(), f.concept?.uuid ?? f.uuid]));

    const mappings: Array<{ envKey: string; matchTerms: string[] }> = [
      { envKey: 'DRUG_FREQ_IMMEDIATE', matchTerms: ['immediately', 'stat', 'now'] },
      { envKey: 'DRUG_FREQ_ONCE_DAILY', matchTerms: ['once a day', 'once daily', 'od'] },
      { envKey: 'DRUG_FREQ_TWICE_DAILY', matchTerms: ['twice a day', 'twice daily', 'bd', 'bid'] },
      { envKey: 'DRUG_FREQ_THRICE_DAILY', matchTerms: ['thrice a day', 'three times a day', 'thrice daily', 'tid'] },
      { envKey: 'DRUG_FREQ_FOUR_TIMES_DAILY', matchTerms: ['four times a day', 'four times daily', 'qid'] },
      { envKey: 'DRUG_FREQ_EVERY_2_HOURS', matchTerms: ['every 2 hours', 'every two hours'] },
      { envKey: 'DRUG_FREQ_EVERY_4_HOURS', matchTerms: ['every 4 hours', 'every four hours'] },
      { envKey: 'DRUG_FREQ_EVERY_6_HOURS', matchTerms: ['every 6 hours', 'every six hours'] },
      { envKey: 'DRUG_FREQ_EVERY_8_HOURS', matchTerms: ['every 8 hours', 'every eight hours'] },
      { envKey: 'DRUG_FREQ_EVERY_12_HOURS', matchTerms: ['every 12 hours', 'every twelve hours'] },
      { envKey: 'DRUG_FREQ_ALTERNATE_DAYS', matchTerms: ['on alternate days', 'alternate days', 'every other day'] },
      { envKey: 'DRUG_FREQ_ONCE_WEEKLY', matchTerms: ['once a week', 'once weekly', 'weekly'] },
      { envKey: 'DRUG_FREQ_TWICE_WEEKLY', matchTerms: ['twice a week', 'twice weekly'] },
      { envKey: 'DRUG_FREQ_EVERY_3_WEEKS', matchTerms: ['every 3 weeks', 'every three weeks'] },
    ];

    let resolved = 0;
    for (const { envKey, matchTerms } of mappings) {
      const uuid = matchTerms.reduce<string | undefined>((found, term) => found ?? byDisplay.get(term), undefined);
      if (uuid) {
        process.env[envKey] = uuid;
        writeEnvVar(envPath, envKey, uuid);
        resolved++;
      } else {
        // Fallback: partial match
        const fallback = freqs.find((f) => matchTerms.some((t) => f.display.toLowerCase().includes(t)));
        if (fallback) {
          const fallbackUuid = fallback.concept?.uuid ?? fallback.uuid;
          process.env[envKey] = fallbackUuid;
          writeEnvVar(envPath, envKey, fallbackUuid);
          resolved++;
        } else {
          console.warn(`  ⚠ Order frequency not found for: ${matchTerms[0]}`);
        }
      }
    }
    console.log(`  ✓ Order frequencies resolved (${resolved}/${mappings.length})`);
  } catch (error) {
    console.warn(`  ⚠ Error fetching order frequencies: ${error}`);
  }
}

/**
 * Resolve drug route UUIDs from the server's allowed drug routes concept set
 * (order.drugRoutesConceptUuid global property). This guarantees only allowed routes are used.
 */
async function setupDrugRoutes(baseUrl: string): Promise<void> {
  const auth = Buffer.from(`${config.users.admin.username}:${config.users.admin.password}`).toString('base64');
  const envPath = resolve(process.cwd(), '.env.local');

  try {
    // Get the allowed routes concept set UUID from global properties
    const propResponse = await fetch(`${baseUrl}/openmrs/ws/rest/v1/systemsetting/order.drugRoutesConceptUuid?v=full`, {
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    });
    if (!propResponse.ok) {
      console.warn(`  ⚠ Could not fetch order.drugRoutesConceptUuid setting`);
      return;
    }
    const propData = await propResponse.json();
    const routesConceptUuid = (propData as { value?: string }).value;
    if (!routesConceptUuid) {
      console.warn(`  ⚠ order.drugRoutesConceptUuid is not set`);
      return;
    }

    // Fetch the concept set members
    const conceptResponse = await fetch(`${baseUrl}/openmrs/ws/rest/v1/concept/${routesConceptUuid}?v=full`, {
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    });
    if (!conceptResponse.ok) {
      console.warn(`  ⚠ Could not fetch drug routes concept set`);
      return;
    }
    const conceptData = await conceptResponse.json();
    const members = (conceptData as { setMembers?: Array<{ uuid: string; display: string }> }).setMembers ?? [];
    const byDisplay = new Map(members.map((m) => [m.display.toLowerCase(), m.uuid]));

    // Map env keys to keyword variants that cover naming differences across environments
    const routeMappings: Array<{ envKey: string; keywords: string[] }> = [
      { envKey: 'DRUG_ROUTE_ORAL', keywords: ['oral'] },
      { envKey: 'DRUG_ROUTE_INTRAVENOUS', keywords: ['intravenous'] },
      { envKey: 'DRUG_ROUTE_INTRAMUSCULAR', keywords: ['intramuscular'] },
      { envKey: 'DRUG_ROUTE_SUBCUTANEOUS', keywords: ['sub cutaneous', 'subcutaneous', 's/c'] },
      { envKey: 'DRUG_ROUTE_PER_VAGINAL', keywords: ['per vaginal', 'vaginal', 'p/v'] },
      { envKey: 'DRUG_ROUTE_PER_RECTUM', keywords: ['per rectum', 'rectal', 'p/r'] },
      { envKey: 'DRUG_ROUTE_SUBLINGUAL', keywords: ['sub lingual', 'sublingual', 's/l'] },
      { envKey: 'DRUG_ROUTE_NASOGASTRIC', keywords: ['nasogastric', 'ng'] },
      { envKey: 'DRUG_ROUTE_INTRADERMAL', keywords: ['intradermal', 'i/d'] },
      { envKey: 'DRUG_ROUTE_INTRAPERITONEAL', keywords: ['intraperitoneal'] },
      { envKey: 'DRUG_ROUTE_INTRATHECAL', keywords: ['intrathecal'] },
      { envKey: 'DRUG_ROUTE_INTRAOSSEOUS', keywords: ['intraosseous'] },
      { envKey: 'DRUG_ROUTE_TOPICAL', keywords: ['topical'] },
      { envKey: 'DRUG_ROUTE_NASAL', keywords: ['nasal'] },
      { envKey: 'DRUG_ROUTE_INHALATION', keywords: ['inhalation'] },
    ];

    let resolved = 0;
    for (const { envKey, keywords } of routeMappings) {
      const uuid = keywords.reduce<string | undefined>(
        (found, kw) => found ?? byDisplay.get(kw) ?? [...byDisplay.entries()].find(([k]) => k.includes(kw))?.[1],
        undefined
      );
      if (uuid) {
        process.env[envKey] = uuid;
        writeEnvVar(envPath, envKey, uuid);
        resolved++;
      } else {
        console.warn(`  ⚠ Route not found in allowed set: ${keywords[0]}`);
      }
    }
    console.log(`  ✓ Drug routes resolved (${resolved}/${routeMappings.length}) from allowed set`);
  } catch (error) {
    console.warn(`  ⚠ Error fetching drug routes: ${error}`);
  }
}

/**
 * Resolve drug order concept UUIDs (routes and dose units only) by display name.
 * Frequencies are resolved separately via setupOrderFrequencies using OrderFrequency UUIDs.
 */
async function setupDrugOrderConcepts(baseUrl: string): Promise<void> {
  const auth = Buffer.from(`${config.users.admin.username}:${config.users.admin.password}`).toString('base64');
  const envPath = resolve(process.cwd(), '.env.local');

  const conceptMappings: Array<{ envKey: string; searchName: string; matchName: string }> = [
    // NOTE: Routes are resolved from the server's allowed drug routes concept set — handled separately
    // Dose units
    { envKey: 'DRUG_DOSE_UNIT_TABLET', searchName: 'Tablet', matchName: 'tablet' },
    { envKey: 'DRUG_DOSE_UNIT_CAPSULE', searchName: 'Capsule', matchName: 'capsule' },
    { envKey: 'DRUG_DOSE_UNIT_ML', searchName: 'ml', matchName: 'ml' },
    { envKey: 'DRUG_DOSE_UNIT_MG', searchName: 'mg', matchName: 'mg' },
    { envKey: 'DRUG_DOSE_UNIT_IU', searchName: 'IU', matchName: 'iu' },
    { envKey: 'DRUG_DOSE_UNIT_DROP', searchName: 'Drop', matchName: 'drop' },
    { envKey: 'DRUG_DOSE_UNIT_TABLESPOON', searchName: 'Tablespoon', matchName: 'tablespoon' },
    { envKey: 'DRUG_DOSE_UNIT_TEASPOON', searchName: 'Teaspoon', matchName: 'teaspoon' },
    { envKey: 'DRUG_DOSE_UNIT_UNIT', searchName: 'Unit(s)', matchName: 'unit' },
    { envKey: 'DRUG_DOSE_UNIT_PUFF', searchName: 'Puff', matchName: 'puff' },
    // NOTE: Frequencies are resolved via setupOrderFrequencies (OrderFrequency UUIDs, not concepts)
  ];

  let resolved = 0;
  for (const { envKey, searchName, matchName } of conceptMappings) {
    try {
      const response = await fetch(
        `${baseUrl}/openmrs/ws/rest/v1/concept?q=${encodeURIComponent(searchName)}&v=default&limit=10`,
        { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' } }
      );
      if (!response.ok) continue;

      const data = await response.json();
      const results = (data as { results: { uuid: string; display: string }[] }).results ?? [];
      const match = results.find((c) => c.display.toLowerCase().includes(matchName));
      if (match) {
        process.env[envKey] = match.uuid;
        writeEnvVar(envPath, envKey, match.uuid);
        resolved++;
      } else {
        console.warn(`  ⚠ Concept not found: "${searchName}"`);
      }
    } catch {
      console.warn(`  ⚠ Error resolving concept "${searchName}"`);
    }
  }
  console.log(`  ✓ Drug order concepts resolved (${resolved}/${conceptMappings.length})`);
}

/**
 * Resolve the OPD location name from the server. Prefers a location named 'OPD-1';
 * falls back to the first non-Unknown location. Writes LOCATION_OPD to .env.local.
 */
async function setupLocations(baseUrl: string): Promise<void> {
  const auth = Buffer.from(`${config.users.admin.username}:${config.users.admin.password}`).toString('base64');

  try {
    const response = await fetch(`${baseUrl}/openmrs/ws/rest/v1/location?v=default&limit=100`, {
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.warn(`  ⚠ Could not fetch locations: ${response.status}`);
      return;
    }

    const data = await response.json();
    const locations = (data as { results: { uuid: string; display: string }[] }).results ?? [];

    const opd1 = locations.find((l) => l.display === 'OPD-1');
    const fallback = locations.find((l) => !l.display.toLowerCase().includes('unknown'));
    const chosen = opd1 ?? fallback;

    if (!chosen) {
      console.warn(`  ⚠ No usable location found on server`);
      return;
    }

    const envPath = resolve(process.cwd(), '.env.local');
    process.env.LOCATION_OPD = chosen.display;
    process.env.LOCATION_LOGIN_UUID = chosen.uuid;
    writeEnvVar(envPath, 'LOCATION_OPD', chosen.display);
    writeEnvVar(envPath, 'LOCATION_LOGIN_UUID', chosen.uuid);
    console.log(`  ✓ OPD location resolved — "${chosen.display}" (${chosen.uuid})`);
  } catch (error) {
    console.warn(`  ⚠ Error fetching locations: ${error}`);
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
    (playwrightConfig as unknown as { use?: { baseURL?: string } }).use?.baseURL ||
    process.env.BASE_URL ||
    'https://localhost/bahmni/home/index.html';

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

  // Resolve server-specific UUIDs and config values
  console.log('Setting up identifier source...');
  await setupIdentifierSource(baseUrl);
  await setupPersonAttributeTypes(baseUrl);
  await setupEncounterTypes(baseUrl);
  await setupOrderTypes(baseUrl);
  await setupOrderFrequencies(baseUrl);
  await setupDrugRoutes(baseUrl);
  await setupDrugOrderConcepts(baseUrl);
  await setupDrugs(baseUrl);
  await setupConcepts(baseUrl);
  await setupLocations(baseUrl);
  console.log('✓ Identifier source setup complete\n');

  // Setup relationship types
  await setupRelationshipTypes(baseUrl);
}

export default globalSetup;
