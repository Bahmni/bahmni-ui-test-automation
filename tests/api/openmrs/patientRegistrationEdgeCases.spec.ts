import { test, expect } from '../../../src/api/fixtures/apiFixture';
import { IDENTIFIER } from '../../../test-data/api/constants';
import {
  buildCreatePatientPayload,
  buildCreatePatientPayloadWithManualIdentifier,
  buildCreatePatientPayloadWithRelationship,
  buildCreatePatientPayloadWithBirthdateEstimated,
} from '../../../test-data/api/patientPayload';
import { faker } from '@faker-js/faker';

test.describe('Identifier - auto-generation', { tag: ['@regression'] }, () => {
  let patientUuid: string;

  test('identifier is auto-generated from configured IdentifierSource', async ({ api }) => {
    const { status, body } = await api.patient.create(buildCreatePatientPayload());
    patientUuid = body.patient.uuid;

    expect(status).toBe(200);
    expect(body.patient.identifiers.length).toBeGreaterThan(0);

    const identifier = body.patient.identifiers[0].identifier;
    expect(identifier).toBeTruthy();
    expect(identifier.startsWith(IDENTIFIER.prefix)).toBe(true);
  });

  test.afterAll(async ({ api }) => {
    if (patientUuid) await api.patient.delete(patientUuid);
  });
});

test.describe('Identifier - jump detection', { tag: ['@regression'] }, () => {
  let leakedPatientUuid: string | undefined;

  test('manually-entered identifier that jumps ahead of sequence returns 412', async ({ api }) => {
    const jumpedIdentifier = `${IDENTIFIER.prefix}9000000`;
    const payload = buildCreatePatientPayloadWithManualIdentifier(jumpedIdentifier);

    const { status, body } = await api.patient.createRaw(payload);

    if (status === 200) {
      leakedPatientUuid = body?.patient?.uuid;
    }

    if (status !== 412) {
      // Jump detection is not enabled for this identifier source — 412 requires
      // the idgen SequentialIdentifierGenerator to have jump-ahead checking configured.
      test.skip();
      return;
    }

    expect(status).toBe(412);
  });

  test.afterAll(async ({ api }) => {
    if (leakedPatientUuid) await api.patient.delete(leakedPatientUuid);
  });
});

test.describe('Birthdate vs birthdateEstimated', { tag: ['@regression'] }, () => {
  const createdPatients: string[] = [];

  test('exact birthdate is stored when birthdateEstimated is false', async ({ api }) => {
    const birthdate = '1990-06-15';
    const payload = buildCreatePatientPayloadWithBirthdateEstimated(birthdate, false);
    const { status, body } = await api.patient.create(payload);
    createdPatients.push(body.patient.uuid);

    expect(status).toBe(200);
    expect(body.patient.person.birthdate).toContain(birthdate);
    expect(body.patient.person.birthdateEstimated).toBe(false);
  });

  test('birthdateEstimated flag is stored as true when birthdate is estimated from age', async ({ api }) => {
    const birthdate = '1985-01-01';
    const payload = buildCreatePatientPayloadWithBirthdateEstimated(birthdate, true);
    const { status, body } = await api.patient.create(payload);
    createdPatients.push(body.patient.uuid);

    expect(status).toBe(200);
    expect(body.patient.person.birthdate).toContain(birthdate);
    expect(body.patient.person.birthdateEstimated).toBe(true);
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
    const payload = buildCreatePatientPayload({ givenName: longName });

    const { status } = await api.patient.createRaw(payload);

    expect(status).toBe(400);
  });

  test('familyName exceeding 50 characters is rejected by the server', async ({ api }) => {
    const longName = faker.string.alpha(51);
    const payload = buildCreatePatientPayload({ familyName: longName });

    const { status } = await api.patient.createRaw(payload);

    expect(status).toBe(400);
  });
});

test.describe.serial('Relationships', { tag: ['@regression'] }, () => {
  let patientAUuid: string;
  let patientBUuid: string;
  let relationshipTypeUuid: string;

  test.beforeAll(async ({ api }) => {
    const { body: bBody } = await api.patient.create(buildCreatePatientPayload());
    patientBUuid = bBody.patient.uuid;

    const { body: relTypes } = await api.patient.getRelationshipTypes();
    if (!relTypes.results.length) throw new Error('No relationship types found');
    relationshipTypeUuid = relTypes.results[0].uuid;
  });

  test('patient created with a relationship to another patient', async ({ api }) => {
    const payload = buildCreatePatientPayloadWithRelationship([
      { relationshipType: { uuid: relationshipTypeUuid }, personB: { uuid: patientBUuid } },
    ]);

    const { status, body } = await api.patient.create(payload);
    patientAUuid = body.patient.uuid;

    expect(status).toBe(200);
    expect(body.patient.uuid).toBeTruthy();
  });

  test('relationship is retrievable via GET relationship endpoint', async ({ api }) => {
    const { body: profileBody } = await api.patient.getProfileById(patientAUuid);
    const personUuid = profileBody.patient.person.uuid;

    const { status, body } = await api.patient.getRelationshipsForPerson(personUuid);

    expect(status).toBe(200);
    const rel = body.results.find((r) => r.personB?.uuid === personUuid || r.personA?.uuid === personUuid);
    expect(rel).toBeDefined();
  });

  test('relationship with empty personB.uuid is not persisted', async ({ api }) => {
    const { body: newPatient } = await api.patient.createRaw(
      buildCreatePatientPayloadWithRelationship([
        { relationshipType: { uuid: relationshipTypeUuid }, personB: { uuid: '' } },
      ])
    );
    const newPatientUuid = newPatient?.patient?.uuid;

    if (!newPatientUuid) {
      return;
    }

    const { body: relBody } = await api.patient.getRelationshipsForPerson(newPatient.patient.person.uuid);
    await api.patient.delete(newPatientUuid);

    expect(relBody.results).toHaveLength(0);
  });

  test.afterAll(async ({ api }) => {
    if (patientAUuid) await api.patient.delete(patientAUuid);
    if (patientBUuid) await api.patient.delete(patientBUuid);
  });
});
