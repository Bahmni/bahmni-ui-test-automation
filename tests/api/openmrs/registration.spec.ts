import { test, expect } from '../../../src/api/fixtures/apiFixture';
import { validateSchema } from '../../../src/utils/schema-validator';
import patientSchema from '../../../test-data/api/schema/patient.schema.json';
import { buildCreatePatientPayload } from '../../../test-data/api/patientPayload';
import { LOCATIONS, VISIT_TYPES } from '../../../test-data/api/constants';
import { buildStartVisitPayload } from '../../../test-data/api/visitPayload';

test.describe.serial('Patient Registration - E2E', () => {
  const payload = buildCreatePatientPayload({
    givenName: 'Kane',
    middleName: 'Man',
    familyName: 'Lam',
    gender: 'M',
    birthdate: '2000-01-01',
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

  let patientUuid: string;
  let visitUuid: string;

  test('POST /patientprofile creates patient with demographics', async ({ api }) => {
    const { status, body } = await api.patient.create(payload);

    expect(status).toBe(200);
    expect(body.patient.uuid).toBeTruthy();
    validateSchema(body, patientSchema);

    patientUuid = body.patient.uuid;
  });

  test('GET /patientprofile verifies patient details', async ({ api }) => {
    const { status, body } = await api.patient.getById(patientUuid);

    expect(status).toBe(200);
    expect(body.patient.person.gender).toBe('M');
    expect(body.patient.person.birthdate).toContain('2000-01-01');
    expect(body.patient.person.names[0].givenName).toBe('Kane');
    expect(body.patient.person.names[0].familyName).toBe('Lam');
    expect(body.patient.person.addresses[0].cityVillage).toBe('new city');
    expect(body.patient.person.addresses[0].stateProvince).toBe('TAMIL NADU');
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
