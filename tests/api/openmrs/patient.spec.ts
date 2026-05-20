import { test, expect } from '../../../src/api/fixtures/apiFixture';
import { validateSchema } from '../../../src/utils/schema-validator';
import patientSchema from '../../../test-data/api/schema/patient.schema.json';
import { buildCreatePatientPayload } from '../../../test-data/api/patientPayload';
import { LOCATIONS, VISIT_TYPES } from '../../../test-data/api/constants';
import { buildStartVisitPayload } from '../../../test-data/api/visitPayload';

test.describe.serial('Patient registration - E2E', { tag: ['@regression'] }, () => {
  const payload = buildCreatePatientPayload();
  let patientUuid: string;
  let locationUuid: string;
  let visitTypeUuid: string;
  let visitUuid: string;

  test.beforeAll(async ({ api }) => {
    const { body: locationBody } = await api.location.getByName(LOCATIONS.opd1);
    locationUuid = locationBody.results[0].uuid;

    const { body: visitTypeBody } = await api.visit.getVisitTypes();
    const opdType = visitTypeBody.results.find((vt) => vt.display.includes(VISIT_TYPES.opd));
    if (!opdType) throw new Error('OPD visit type not found');
    visitTypeUuid = opdType.uuid;
  });

  test('POST /patientprofile creates patient and returns uuid', async ({ api }) => {
    const { status, body } = await api.patient.create(payload);

    expect(status).toBe(200);
    expect(body.patient.uuid).toBeTruthy();
    validateSchema(body, patientSchema);

    patientUuid = body.patient.uuid;
  });

  test('GET patient returns correct demographics', async ({ api }) => {
    const { status, body } = await api.patient.getProfileById(patientUuid);

    expect(status).toBe(200);
    expect(body.patient.person.gender).toBe(payload.patient.person.gender);
    expect(body.patient.person.birthdate).toContain(payload.patient.person.birthdate);
  });

  test('POST /visit starts OPD visit for patient', async ({ api }) => {
    const visitPayload = buildStartVisitPayload(patientUuid, visitTypeUuid, locationUuid);
    const { status, body } = await api.visit.create(visitPayload);

    expect(status).toBe(201);
    expect(body.uuid).toBeTruthy();
    expect(body.visitType.display).toContain(VISIT_TYPES.opd);

    visitUuid = body.uuid;
  });

  test('GET active visit confirms visit is open', async ({ api }) => {
    const { status, body } = await api.visit.getActiveByPatient(patientUuid);

    expect(status).toBe(200);
    expect(body.uuid).toBe(visitUuid);
    expect(body.stopDatetime).toBeNull();
  });

  test.afterAll(async ({ api }) => {
    if (visitUuid) await api.visit.end(visitUuid);
    if (patientUuid) await api.patient.delete(patientUuid);
  });
});
