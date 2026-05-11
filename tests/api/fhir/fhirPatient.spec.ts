import { test, expect } from '../../../src/api/fixtures/apiFixture';
import { buildCreatePatientPayload } from '../../../test-data/api/patientPayload';

test.describe.serial('FHIR Patient - resource validation', () => {
  const payload = buildCreatePatientPayload();
  let patientUuid: string;
  let patientIdentifier: string;

  test.beforeAll(async ({ api }) => {
    const { body } = await api.patient.create(payload);
    patientUuid = body.patient.uuid;
    patientIdentifier = body.patient.identifiers[0].identifier;
  });

  test('GET /fhir2/R4/Patient/{uuid} returns resourceType Patient', async ({ api }) => {
    const { status, body } = await api.fhir.getPatient(patientUuid);

    expect(status).toBe(200);
    expect((body as unknown as Record<string, unknown>).resourceType).toBe('Patient');
  });

  test('Patient resource contains mandatory identifier element', async ({ api }) => {
    const { body } = await api.fhir.getPatient(patientUuid);
    const patient = body as unknown as {
      identifier: Array<{ value: string }>;
    };

    expect(patient.identifier).toBeDefined();
    expect(patient.identifier.length).toBeGreaterThan(0);
    expect(patient.identifier[0].value).toBe(patientIdentifier);
  });

  test('Patient resource contains mandatory name element', async ({ api }) => {
    const { body } = await api.fhir.getPatient(patientUuid);
    const patient = body as unknown as {
      name: Array<{ family: string; given: string[] }>;
    };

    expect(patient.name).toBeDefined();
    expect(patient.name.length).toBeGreaterThan(0);
    expect(patient.name[0].family).toBe(payload.patient.person.names[0].familyName);
    expect(patient.name[0].given[0]).toBe(payload.patient.person.names[0].givenName);
  });

  test('Patient resource contains mandatory gender element', async ({ api }) => {
    const { body } = await api.fhir.getPatient(patientUuid);
    const patient = body as unknown as { gender: string };

    expect(patient.gender).toBeDefined();
    expect(['male', 'female', 'other', 'unknown']).toContain(patient.gender);
  });

  test('Patient resource contains mandatory birthDate element', async ({ api }) => {
    const { body } = await api.fhir.getPatient(patientUuid);
    const patient = body as unknown as { birthDate: string };

    expect(patient.birthDate).toBeDefined();
    expect(patient.birthDate).toContain(payload.patient.person.birthdate);
  });

  test('GET /fhir2/R4/Encounter?patient={uuid} returns Bundle for newly registered patient', async ({ api }) => {
    const { status, body } = await api.fhir.getEncounters(patientUuid);

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');
  });

  test.afterAll(async ({ api }) => {
    if (patientUuid) await api.patient.delete(patientUuid);
  });
});
