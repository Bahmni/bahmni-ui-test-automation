import { test, expect } from '../../../src/api/fixtures/apiFixture';
import { validateSchema } from '../../../src/utils/schema-validator';
import patientSchema from '../../../test-data/api/schema/patient.schema.json';
import { buildCreatePatientPayload } from '../../../test-data/api/patientPayload';
import { IDENTIFIER, LOCATIONS, VISIT_TYPES } from '../../../test-data/api/constants';
import { buildStartVisitPayload } from '../../../test-data/api/visitPayload';

test.describe.serial('Patient Registration - E2E', { tag: ['@regression'] }, () => {
  let patientUuid: string;
  let visitUuid: string;
  let identifier: string;

  test('POST /Patient creates patient with demographics', async ({ api }) => {
    identifier = await api.patient.generateIdentifier(IDENTIFIER.sourceUuid);
    const payload = buildCreatePatientPayload(identifier, {
      givenName: 'Kane',
      middleName: 'Man',
      familyName: 'Lam',
      gender: 'male',
      birthDate: '2000-01-01',
      phoneNumber: '9890989090',
      email: 'kane@test.com',
      address: {
        address1: 'no 9',
        address2: 'new loc',
        cityVillage: 'new city',
        postalCode: '600092',
        countyDistrict: 'CHENNAI',
        stateProvince: 'TAMIL NADU',
      },
    });

    const { status, body } = await api.patient.create(payload);

    expect(status).toBe(201);
    expect(body.id).toBeTruthy();
    validateSchema(body, patientSchema);

    patientUuid = body.id;
  });

  test('GET /Patient verifies patient details', async ({ api }) => {
    const { status, body } = await api.patient.getById(patientUuid);

    expect(status).toBe(200);
    expect(body.gender).toBe('male');
    expect(body.birthDate).toBe('2000-01-01');
    expect(body.name[0].given[0]).toBe('Kane');
    expect(body.name[0].family).toBe('Lam');
    expect(body.address?.[0].city).toBe('new city');
    expect(body.address?.[0].state).toBe('TAMIL NADU');
  });

  test('GET /visit confirms no active visit yet', async ({ api }) => {
    const { status, body } = await api.visit.getActiveByPatientRaw(patientUuid);

    expect(status).toBe(200);
    expect(body.results).toHaveLength(0);
  });

  test('POST /visit starts OPD visit', async ({ api }) => {
    const { body: visitLocationBody } = await api.visit.getVisitLocation(LOCATIONS.loginLocationUuid);
    const visitLocationUuid = visitLocationBody.uuid;

    const { body: visitTypeBody } = await api.visit.getVisitTypes();
    const opdType = visitTypeBody.results.find((vt) => vt.display.includes(VISIT_TYPES.opd));
    if (!opdType) throw new Error('OPD visit type not found');

    const visitPayload = buildStartVisitPayload(patientUuid, opdType.uuid, visitLocationUuid);
    const { status, body } = await api.visit.create(visitPayload);

    expect(status).toBe(201);
    expect(body.uuid).toBeTruthy();
    expect(body.visitType.display).toContain('OPD');

    visitUuid = body.uuid;
  });

  test('GET /visit confirms visit is active', async ({ api }) => {
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
