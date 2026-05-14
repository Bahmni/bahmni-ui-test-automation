import { test, expect } from '../../../src/api/fixtures/apiFixture';
import { buildCreatePatientPayload } from '../../../test-data/api/patientPayload';

test.describe.serial('FHIR Patient — resource mapping', () => {
  const payload = buildCreatePatientPayload();
  let patientUuid: string;
  let patientIdentifier: string;

  test.beforeAll(async ({ api }) => {
    const { body } = await api.patient.create(payload);
    patientUuid = body.patient.uuid;
    patientIdentifier = body.patient.identifiers[0].identifier;
  });

  test('GET /fhir2/R4/Patient/{uuid} — OpenMRS person fields map to FHIR Patient resource (resourceType, identifier, name, gender, birthDate)', async ({
    api,
  }) => {
    const { status, body } = await api.fhir.getPatient(patientUuid);
    const patient = body as unknown as {
      resourceType: string;
      identifier: Array<{ value: string }>;
      name: Array<{ family: string; given: string[] }>;
      gender: string;
      birthDate: string;
    };

    expect(status).toBe(200);
    expect(patient.resourceType).toBe('Patient');
    expect(patient.identifier?.[0]?.value).toBe(patientIdentifier);
    expect(patient.name?.[0]?.family).toBe(payload.patient.person.names[0].familyName);
    expect(patient.name?.[0]?.given?.[0]).toBe(payload.patient.person.names[0].givenName);
    expect(['male', 'female', 'other', 'unknown']).toContain(patient.gender);
    expect(patient.birthDate).toContain(payload.patient.person.birthdate);
  });

  test.afterAll(async ({ api }) => {
    if (patientUuid) await api.patient.delete(patientUuid);
  });
});
