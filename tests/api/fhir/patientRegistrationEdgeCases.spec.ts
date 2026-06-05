import { test, expect } from '../../../src/api/fixtures/apiFixture';
import { IDENTIFIER } from '../../../test-data/api/constants';
import { buildCreatePatientPayload } from '../../../test-data/api/patientPayload';
import { faker } from '@faker-js/faker';

test.describe('Identifier - auto-generation', { tag: ['@regression'] }, () => {
  let patientUuid: string;

  test('identifier is auto-generated from configured IdentifierSource', async ({ api }) => {
    const identifier = await api.patient.generateIdentifier(IDENTIFIER.sourceUuid);

    expect(identifier).toBeTruthy();
    expect(identifier.startsWith(IDENTIFIER.prefix)).toBe(true);

    const { status, body } = await api.patient.create(buildCreatePatientPayload(identifier));
    patientUuid = body.id;

    expect(status).toBe(201);
    expect(body.identifier[0].value).toBe(identifier);
  });

  test.afterAll(async ({ api }) => {
    if (patientUuid) await api.patient.delete(patientUuid);
  });
});

test.describe('Birthdate granularity', { tag: ['@regression'] }, () => {
  const createdPatients: string[] = [];

  test('exact birthdate picked from datepicker is stored as YYYY-MM-DD', async ({ api }) => {
    const birthDate = '1990-06-15';
    const identifier = await api.patient.generateIdentifier(IDENTIFIER.sourceUuid);
    const { status, body } = await api.patient.create(buildCreatePatientPayload(identifier, { birthDate }));
    createdPatients.push(body.id);

    expect(status).toBe(201);
    expect(body.birthDate).toBe(birthDate);
  });

  // TODO: server truncates partial date "1990-07" → "1990" on read; confirm intended behaviour.
  test('birthdate estimated from age is stored as partial date (year only)', async ({ api }) => {
    const identifier = await api.patient.generateIdentifier(IDENTIFIER.sourceUuid);
    const { status, body } = await api.patient.create(buildCreatePatientPayload(identifier, { birthDate: '1990-07' }));
    createdPatients.push(body.id);

    expect(status).toBe(201);
    expect(body.birthDate).toBe('1990');
  });

  test.afterAll(async ({ api }) => {
    for (const uuid of createdPatients) {
      await api.patient.delete(uuid);
    }
  });
});

test.describe('Patient name length validation', { tag: ['@regression'] }, () => {
  test('givenName exceeding 50 characters is rejected by the server', async ({ api }) => {
    const longName = faker.string.alpha(51);
    const identifier = await api.patient.generateIdentifier(IDENTIFIER.sourceUuid);
    const payload = buildCreatePatientPayload(identifier, { givenName: longName });

    const { status } = await api.patient.createRaw(payload);

    expect(status).toBe(422);
  });

  test('familyName exceeding 50 characters is rejected by the server', async ({ api }) => {
    const longName = faker.string.alpha(51);
    const identifier = await api.patient.generateIdentifier(IDENTIFIER.sourceUuid);
    const payload = buildCreatePatientPayload(identifier, { familyName: longName });

    const { status } = await api.patient.createRaw(payload);

    expect(status).toBe(422);
  });
});
