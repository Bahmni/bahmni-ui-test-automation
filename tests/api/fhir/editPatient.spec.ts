import { test, expect } from '../../../src/api/fixtures/apiFixture';
import { IDENTIFIER } from '../../../test-data/api/constants';
import { buildCreatePatientPayload, buildUpdatePatientPayload } from '../../../test-data/api/patientPayload';

const PHONE_EXT_URL = 'http://fhir.bahmni.org/ext/patient/phonenumber';
const ALT_PHONE_EXT_URL = 'http://fhir.bahmni.org/ext/patient/alternatephonenumber';
const EMAIL_EXT_URL = 'http://fhir.bahmni.org/ext/patient/email';
const ADDRESS_EXT_URL = 'http://fhir.openmrs.org/ext/address';
const ADDRESS1_EXT_URL = 'http://fhir.openmrs.org/ext/address#address1';
const ADDRESS2_EXT_URL = 'http://fhir.openmrs.org/ext/address#address2';

test.describe.serial('Patient edit - E2E', { tag: ['@regression'] }, () => {
  let patientUuid: string;

  test('PUT /Patient updates name, gender, birthDate, address, phone, email and is reflected on GET', async ({
    api,
  }) => {
    const identifier = await api.patient.generateIdentifier(IDENTIFIER.sourceUuid);
    const { body: created } = await api.patient.create(
      buildCreatePatientPayload(identifier, {
        givenName: 'Original',
        middleName: 'Mid',
        familyName: 'Family',
        gender: 'male',
        birthDate: '1990-01-01',
        phoneNumber: '1111111111',
        alternatePhoneNumber: '2222222222',
        email: 'original@test.com',
        address: {
          address1: '100',
          address2: '1st street',
          cityVillage: 'OldCity',
          countyDistrict: 'CHENNAI',
          stateProvince: 'TAMIL NADU',
          postalCode: '600001',
        },
      })
    );
    patientUuid = created.id;

    const updatePayload = buildUpdatePatientPayload(created, {
      givenName: 'Updated',
      middleName: 'NewMid',
      familyName: 'NewFamily',
      gender: 'female',
      birthDate: '1985-06-06',
      phoneNumber: '9999999999',
      alternatePhoneNumber: '8888888888',
      email: 'updated@test.com',
      address: {
        address1: '317',
        address2: '12th street',
        cityVillage: 'NewCity',
        countyDistrict: 'CHENNAI',
        stateProvince: 'TAMIL NADU',
        postalCode: '600092',
      },
    });

    const { status: updateStatus } = await api.patient.update(patientUuid, updatePayload);
    expect(updateStatus).toBe(200);

    const { status, body } = await api.patient.getById(patientUuid);
    expect(status).toBe(200);

    expect(body.name[0].given).toEqual(['Updated', 'NewMid']);
    expect(body.name[0].family).toBe('NewFamily');
    expect(body.gender).toBe('female');
    expect(body.birthDate).toBe('1985-06-06');

    const phone = body.extension?.find((e) => e.url === PHONE_EXT_URL)?.valueString;
    const altPhone = body.extension?.find((e) => e.url === ALT_PHONE_EXT_URL)?.valueString;
    const email = body.extension?.find((e) => e.url === EMAIL_EXT_URL)?.valueString;
    expect(phone).toBe('9999999999');
    expect(altPhone).toBe('8888888888');
    expect(email).toBe('updated@test.com');

    const address = body.address?.[0];
    expect(address?.city).toBe('NewCity');
    expect(address?.district).toBe('CHENNAI');
    expect(address?.state).toBe('TAMIL NADU');
    expect(address?.postalCode).toBe('600092');

    const addressLines = address?.extension?.find((e) => e.url === ADDRESS_EXT_URL)?.extension ?? [];
    const address1 = addressLines.find((e) => e.url === ADDRESS1_EXT_URL)?.valueString;
    const address2 = addressLines.find((e) => e.url === ADDRESS2_EXT_URL)?.valueString;
    expect(address1).toBe('317');
    expect(address2).toBe('12th street');
  });

  test.afterAll(async ({ api }) => {
    if (patientUuid) await api.patient.delete(patientUuid);
  });
});
