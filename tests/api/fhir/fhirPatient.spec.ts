import { test, expect } from '../../../src/api/fixtures/apiFixture';
import { buildCreatePatientPayload } from '../../../test-data/api/patientPayload';
import { IDENTIFIER } from '../../../test-data/api/constants';

test.describe.serial('FHIR Patient — resource mapping', { tag: ['@regression'] }, () => {
  let patientUuid: string;
  let patientIdentifier: string;
  let createdPayload: ReturnType<typeof buildCreatePatientPayload>;

  test.beforeAll(async ({ api }) => {
    patientIdentifier = await api.patient.generateIdentifier(IDENTIFIER.sourceUuid);
    createdPayload = buildCreatePatientPayload(patientIdentifier);
    const { body } = await api.patient.create(createdPayload);
    patientUuid = body.id;
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
    expect(patient.name?.[0]?.family).toBe(createdPayload.name[0].family);
    expect(patient.name?.[0]?.given?.[0]).toBe(createdPayload.name[0].given[0]);
    expect(['male', 'female', 'other', 'unknown']).toContain(patient.gender);
    expect(patient.birthDate).toBe(createdPayload.birthDate);
  });

  test.afterAll(async ({ api }) => {
    if (patientUuid) await api.patient.delete(patientUuid);
  });
});
