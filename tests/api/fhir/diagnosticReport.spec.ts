import { test, expect } from '../../../src/api/fixtures/apiFixture';
import { validateSchema } from '../../../src/utils/schema-validator';
import fhirBundleSchema from '../../../test-data/api/schema/fhir-bundle.schema.json';
import { buildCreatePatientPayload } from '../../../test-data/api/patientPayload';
import { buildStartVisitPayload } from '../../../test-data/api/visitPayload';
import { LOCATIONS, VISIT_TYPES } from '../../../test-data/api/constants';

test.describe.serial('FHIR Diagnostic Report - E2E', () => {
  let patientUuid: string;
  let visitUuid: string;
  test.beforeAll(async ({ api }) => {
    const patient = await api.patient.create(buildCreatePatientPayload());
    patientUuid = patient.body.patient.uuid;

    const { body: locationBody } = await api.location.getByName(LOCATIONS.opd1);
    const locationUuid = locationBody.results[0].uuid;

    const { body: visitTypeBody } = await api.visit.getVisitTypes();
    const opdType = visitTypeBody.results.find((vt) => vt.display.includes(VISIT_TYPES.opd));
    if (!opdType) throw new Error('OPD visit type not found');

    const visit = await api.visit.create(buildStartVisitPayload(patientUuid, opdType.uuid, locationUuid));
    visitUuid = visit.body.uuid;
  });

  test('GET encounters returns FHIR bundle for patient', async ({ api }) => {
    const { status, body } = await api.fhir.getEncounters(patientUuid);

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');

    if (body.entry && body.entry.length > 0) {
      validateSchema(body, fhirBundleSchema);
    }
  });

  test('GET service requests returns FHIR bundle', async ({ api }) => {
    const { status, body } = await api.fhir.getServiceRequests(patientUuid);

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');
  });

  test.afterAll(async ({ api }) => {
    if (visitUuid) await api.visit.end(visitUuid);
    if (patientUuid) await api.patient.delete(patientUuid);
  });
});
