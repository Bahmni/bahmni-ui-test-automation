import { test, expect } from '../../../src/api/fixtures/apiFixture';
import { validateSchema } from '../../../src/utils/schema-validator';
import patientSchema from '../../../test-data/api/schema/patient.schema.json';
import { buildCreatePatientPayload } from '../../../test-data/api/patientPayload';
import { IDENTIFIER, LOCATIONS, VISIT_TYPES } from '../../../test-data/api/constants';
import { buildStartVisitPayload } from '../../../test-data/api/visitPayload';
import { CreatePatientRequest } from '../../../src/api/types/patient.types';

test.describe.serial('Patient registration - E2E', { tag: ['@regression'] }, () => {
  let payload: CreatePatientRequest;
  let patientUuid: string;
  let locationUuid: string;
  let visitTypeUuid: string;
  let visitUuid: string;

  test.beforeAll(async ({ api }) => {
    const identifier = await api.patient.generateIdentifier(IDENTIFIER.sourceUuid);
    payload = buildCreatePatientPayload(identifier);

    const { body: locationBody } = await api.location.getByName(LOCATIONS.opd1);
    locationUuid = locationBody.results[0].uuid;

    const { body: visitTypeBody } = await api.visit.getVisitTypes();
    const opdType = visitTypeBody.results.find((vt) => vt.display.includes(VISIT_TYPES.opd));
    if (!opdType) throw new Error('OPD visit type not found');
    visitTypeUuid = opdType.uuid;
  });

  test('POST /Patient creates patient and returns id', async ({ api }) => {
    const { status, body } = await api.patient.create(payload);

    expect(status).toBe(201);
    expect(body.id).toBeTruthy();
    validateSchema(body, patientSchema);

    patientUuid = body.id;
  });

  test('GET patient returns correct demographics', async ({ api }) => {
    const { status, body } = await api.patient.getById(patientUuid);

    expect(status).toBe(200);
    expect(body.gender).toBe(payload.gender);
    expect(body.birthDate).toBe(payload.birthDate);
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
