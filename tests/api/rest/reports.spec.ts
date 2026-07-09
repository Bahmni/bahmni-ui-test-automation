import { test, expect } from '../../../src/api/fixtures/apiFixture';
import { buildCreatePatientPayload } from '../../../test-data/api/patientPayload';
import { buildStartVisitPayload } from '../../../test-data/api/visitPayload';
import { buildAppointmentPayload, futureAppointmentWindow } from '../../../test-data/api/appointmentPayload';
import {
  setupConsultationContext,
  teardownConsultationContext,
  extractFirstUuidFromBundle,
  ConsultationContext,
} from '../../../src/api/helpers/consultationSetup';
import { buildAllergyBundle, buildMultipleDiagnosisBundle } from '../../../test-data/api/encounterBundlePayload';
import {
  IDENTIFIER,
  LOCATIONS,
  VISIT_TYPES,
  APPOINTMENT_SERVICES,
  CONDITION_CODES,
} from '../../../test-data/api/constants';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const OPD_EMERGENCY_COLUMNS = ['New_OPD', 'Old_OPD', 'Total_OPD', 'New_Emergency', 'Old_Emergency', 'Total_Emergency'];

const DIAGNOSIS_COUNT_COLUMNS = ['Diagnosis', 'Female', 'Male', 'Other', 'Not disclosed', 'Total'];

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function formatReportDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  return `${day}-${MONTHS[date.getMonth()]}-${date.getFullYear()}`;
}

function formatSlashDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

function ageFromBirthDate(birthDate: string): number {
  return Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function extractReportCount(html: string, columnHeader: string): number {
  const colIndex = OPD_EMERGENCY_COLUMNS.indexOf(columnHeader);
  if (colIndex === -1) return -1;
  const afterHeaders = html.split('Total_Emergency').pop() ?? '';
  const values = [...afterHeaders.matchAll(/<span[^>]*>(\d+)<\/span>/g)].map((m) => parseInt(m[1], 10));
  return values[colIndex] ?? -1;
}

function extractDiagnosisCount(html: string, diagnosisName: string, column: 'Female' | 'Male' | 'Total'): number {
  const spans = [...html.matchAll(/<span[^>]*>([^<]+)<\/span>/g)].map((m) => m[1].trim()).filter(Boolean);
  const headerStart = spans.findIndex((s) => s === 'Diagnosis');
  if (headerStart === -1) return -1;
  const colIndex = DIAGNOSIS_COUNT_COLUMNS.indexOf(column);
  const data = spans.slice(headerStart + DIAGNOSIS_COUNT_COLUMNS.length);
  for (let i = 0; i < data.length; i += DIAGNOSIS_COUNT_COLUMNS.length) {
    if (data[i] === diagnosisName) return parseInt(data[i + colIndex] ?? '-1', 10);
  }
  return -1;
}

test.describe.serial('Reports — Clinic Visit Report', { tag: ['@regression', '@onlyLite'] }, () => {
  test.describe.configure({ timeout: 90_000 });

  let patientUuid: string;
  let patientIdentifier: string;
  const patientGivenName = 'ReportTest';
  const patientFamilyName = 'ClinicVisit';
  const patientBirthDate = '1990-01-01';
  const patientPhone = '9876543210';
  const patientCity = 'Chennai';
  const patientState = 'TAMIL NADU';

  test.beforeAll(async ({ api }) => {
    patientIdentifier = await api.patient.generateIdentifier(IDENTIFIER.sourceUuid);

    const { body: patientBody } = await api.patient.create(
      buildCreatePatientPayload(patientIdentifier, {
        givenName: patientGivenName,
        familyName: patientFamilyName,
        gender: 'male',
        birthDate: patientBirthDate,
        phoneNumber: patientPhone,
        address: {
          cityVillage: patientCity,
          stateProvince: patientState,
          countyDistrict: 'Chennai',
        },
      })
    );
    patientUuid = patientBody.id;

    const { body: locationBody } = await api.location.getByName(LOCATIONS.opd1);
    const locationUuid = locationBody.results[0].uuid;

    const { body: visitTypeBody } = await api.visit.getVisitTypes();
    const opdType = visitTypeBody.results.find((vt) => vt.display.includes(VISIT_TYPES.opd));
    if (!opdType) throw new Error('OPD visit type not found');

    await api.visit.create(buildStartVisitPayload(patientUuid, opdType.uuid, locationUuid));
  });

  test('Clinic Visit Report validates all fields for the patient visit', async ({ api }) => {
    const { status, body } = await api.report.generate({
      name: 'Clinic Visit Report',
      startDate: today(),
      endDate: today(),
    });

    expect(status).toBe(200);
    expect(body).toContain(patientIdentifier);
    expect(body).toContain(`${patientGivenName} ${patientFamilyName}`);
    expect(body).toContain(String(ageFromBirthDate(patientBirthDate)));
    expect(body).toContain('01-Jan-1990');
    expect(body).toContain('>M<');
    expect(body).toContain(formatReportDate(new Date()));
    expect(body).toContain(patientPhone);
    expect(body).toContain(patientCity);
    expect(body).toContain(patientState);
    expect(body).toContain(VISIT_TYPES.opd);
    expect(body).toContain('Active');
  });

  test.afterAll(async ({ api }) => {
    if (patientUuid) await api.patient.delete(patientUuid).catch(() => {});
  });
});

test.describe.serial('Reports — OPD/Emergency Visit Count', { tag: ['@regression', '@onlyLite'] }, () => {
  test.describe.configure({ timeout: 90_000 });

  let opdPatientUuid: string;
  let emergencyPatientUuid: string;
  let baselineNewOpd: number;
  let baselineTotalOpd: number;
  let baselineNewEmergency: number;
  let baselineTotalEmergency: number;

  test.beforeAll(async ({ api }) => {
    const { body: baselineBody } = await api.report.generate({
      name: 'OPD/Emergency Visit Count',
      startDate: today(),
      endDate: today(),
    });
    baselineNewOpd = extractReportCount(baselineBody, 'New_OPD');
    baselineTotalOpd = extractReportCount(baselineBody, 'Total_OPD');
    baselineNewEmergency = extractReportCount(baselineBody, 'New_Emergency');
    baselineTotalEmergency = extractReportCount(baselineBody, 'Total_Emergency');

    const { body: locationBody } = await api.location.getByName(LOCATIONS.opd1);
    const locationUuid = locationBody.results[0].uuid;

    const { body: visitTypeBody } = await api.visit.getVisitTypes();
    const opdType = visitTypeBody.results.find((vt) => vt.display.includes(VISIT_TYPES.opd));
    const emergencyType = visitTypeBody.results.find((vt) => vt.display.toLowerCase().includes('emergency'));
    if (!opdType) throw new Error('OPD visit type not found');
    if (!emergencyType) throw new Error('Emergency visit type not found');

    const { body: opdPatientBody } = await api.patient.create(
      buildCreatePatientPayload(await api.patient.generateIdentifier(IDENTIFIER.sourceUuid), {
        givenName: 'ReportTest',
        familyName: 'OpdVisitCount',
        gender: 'male',
        birthDate: '1990-01-01',
      })
    );
    opdPatientUuid = opdPatientBody.id;
    await api.visit.create(buildStartVisitPayload(opdPatientUuid, opdType.uuid, locationUuid));

    const { body: emergencyPatientBody } = await api.patient.create(
      buildCreatePatientPayload(await api.patient.generateIdentifier(IDENTIFIER.sourceUuid), {
        givenName: 'ReportTest',
        familyName: 'EmergencyVisitCount',
        gender: 'female',
        birthDate: '1990-01-01',
      })
    );
    emergencyPatientUuid = emergencyPatientBody.id;
    await api.visit.create(buildStartVisitPayload(emergencyPatientUuid, emergencyType.uuid, locationUuid));
  });

  test('OPD/Emergency Visit Count increases after creating OPD and Emergency visits', async ({ api }) => {
    const { status, body } = await api.report.generate({
      name: 'OPD/Emergency Visit Count',
      startDate: today(),
      endDate: today(),
    });

    expect(status).toBe(200);
    expect(extractReportCount(body, 'New_OPD')).toBeGreaterThanOrEqual(baselineNewOpd + 1);
    expect(extractReportCount(body, 'Total_OPD')).toBeGreaterThanOrEqual(baselineTotalOpd + 1);
    expect(extractReportCount(body, 'New_Emergency')).toBeGreaterThanOrEqual(baselineNewEmergency + 1);
    expect(extractReportCount(body, 'Total_Emergency')).toBeGreaterThanOrEqual(baselineTotalEmergency + 1);
  });

  test.afterAll(async ({ api }) => {
    if (opdPatientUuid) await api.patient.delete(opdPatientUuid).catch(() => {});
    if (emergencyPatientUuid) await api.patient.delete(emergencyPatientUuid).catch(() => {});
  });
});

test.describe.serial('Reports — Missed Appointments Report', { tag: ['@regression', '@onlyLite'] }, () => {
  test.describe.configure({ timeout: 90_000 });

  let patientUuid: string;
  let patientIdentifier: string;
  const patientGivenName = 'ReportTest';
  const patientFamilyName = 'MissedAppt';
  const patientPhone = '9876543211';
  const patientBirthDate = '1990-06-15';

  test.beforeAll(async ({ api }) => {
    patientIdentifier = await api.patient.generateIdentifier(IDENTIFIER.sourceUuid);

    const { body: patientBody } = await api.patient.create(
      buildCreatePatientPayload(patientIdentifier, {
        givenName: patientGivenName,
        familyName: patientFamilyName,
        gender: 'female',
        birthDate: patientBirthDate,
        phoneNumber: patientPhone,
      })
    );
    patientUuid = patientBody.id;

    const { body: locationBody } = await api.location.getByName(LOCATIONS.opd1);
    const locationUuid = locationBody.results[0].uuid;

    const { body: sessionBody } = await api.user.getSession();
    const { body: providerBody } = await api.user.getProviderByUser(sessionBody.user.uuid);
    if (!providerBody.results.length) throw new Error('No provider found for admin user');
    const practitionerUuid = providerBody.results[0].uuid;

    await api.appointment.create(
      buildAppointmentPayload({
        patientUuid,
        serviceUuid: APPOINTMENT_SERVICES.primary,
        practitionerUuid,
        locationUuid,
        window: futureAppointmentWindow(0),
        status: 'Missed',
      })
    );
  });

  test('Missed Appointments Report validates all fields for the missed appointment', async ({ api }) => {
    const { status, body } = await api.report.generate({
      name: 'Missed Appointments Report',
      startDate: today(),
      endDate: today(),
    });

    expect(status).toBe(200);
    expect(body).toContain(patientIdentifier);
    expect(body).toContain(patientGivenName);
    expect(body).toContain(patientFamilyName);
    expect(body).toContain(String(ageFromBirthDate(patientBirthDate)));
    expect(body).toContain('>F<');
    expect(body).toContain(formatSlashDate(new Date()));
    expect(body).toContain(patientPhone);
  });

  test.afterAll(async ({ api }) => {
    if (patientUuid) await api.patient.delete(patientUuid).catch(() => {});
  });
});

test.describe.serial('Reports — List of Patients to Follow Up', { tag: ['@regression', '@onlyLite'] }, () => {
  test.describe.configure({ timeout: 90_000 });

  let patientUuid: string;
  let patientIdentifier: string;
  const patientGivenName = 'ReportTest';
  const patientFamilyName = 'FollowUp';
  const patientPhone = '9876543212';
  const patientBirthDate = '1990-01-01';

  test.beforeAll(async ({ api }) => {
    patientIdentifier = await api.patient.generateIdentifier(IDENTIFIER.sourceUuid);

    const { body: patientBody } = await api.patient.create(
      buildCreatePatientPayload(patientIdentifier, {
        givenName: patientGivenName,
        familyName: patientFamilyName,
        gender: 'male',
        birthDate: patientBirthDate,
        phoneNumber: patientPhone,
      })
    );
    patientUuid = patientBody.id;

    const { body: locationBody } = await api.location.getByName(LOCATIONS.opd1);
    const locationUuid = locationBody.results[0].uuid;

    const { body: sessionBody } = await api.user.getSession();
    const { body: providerBody } = await api.user.getProviderByUser(sessionBody.user.uuid);
    if (!providerBody.results.length) throw new Error('No provider found for admin user');
    const practitionerUuid = providerBody.results[0].uuid;

    await api.appointment.create(
      buildAppointmentPayload({
        patientUuid,
        serviceUuid: APPOINTMENT_SERVICES.primary,
        practitionerUuid,
        locationUuid,
        window: futureAppointmentWindow(0),
        status: 'Scheduled',
      })
    );
  });

  test('List of Patients to Follow Up validates all fields for the scheduled appointment', async ({ api }) => {
    const { status, body } = await api.report.generate({
      name: 'List of Patients to follow up',
      startDate: today(),
      endDate: today(),
    });

    expect(status).toBe(200);
    expect(body).toContain(patientIdentifier);
    expect(body).toContain(patientGivenName);
    expect(body).toContain(patientFamilyName);
    expect(body).toContain(String(ageFromBirthDate(patientBirthDate)));
    expect(body).toContain('>M<');
    expect(body).toContain(patientPhone);
    expect(body).toContain(formatSlashDate(new Date()));
  });

  test.afterAll(async ({ api }) => {
    if (patientUuid) await api.patient.delete(patientUuid).catch(() => {});
  });
});

test.describe.serial('Reports — Registered Patient Report', { tag: ['@regression', '@onlyLite'] }, () => {
  test.describe.configure({ timeout: 90_000 });

  let patientUuid: string;
  let patientIdentifier: string;
  const patientGivenName = 'ReportTest';
  const patientFamilyName = 'RegisteredPatient';
  const patientBirthDate = '1990-01-01';

  test.beforeAll(async ({ api }) => {
    patientIdentifier = await api.patient.generateIdentifier(IDENTIFIER.sourceUuid);

    const { body: patientBody } = await api.patient.create(
      buildCreatePatientPayload(patientIdentifier, {
        givenName: patientGivenName,
        familyName: patientFamilyName,
        gender: 'male',
        birthDate: patientBirthDate,
      })
    );
    patientUuid = patientBody.id;
  });

  test('Registered Patient Report validates all fields for the registered patient', async ({ api }) => {
    const { status, body } = await api.report.generate({
      name: 'Registered Patient Report',
      startDate: today(),
      endDate: today(),
    });

    expect(status).toBe(200);
    expect(body).toContain(patientIdentifier);
    expect(body).toContain(`${patientGivenName} ${patientFamilyName}`);
    expect(body).toContain(String(ageFromBirthDate(patientBirthDate)));
    expect(body).toContain('>M<');
    expect(body).toContain(formatReportDate(new Date()));
  });

  test.afterAll(async ({ api }) => {
    if (patientUuid) await api.patient.delete(patientUuid).catch(() => {});
  });
});

test.describe.serial('Reports — Notifiable Diseases', { tag: ['@regression', '@onlyLite'] }, () => {
  test.describe.configure({ timeout: 90_000 });

  let ctx: ConsultationContext;

  test.beforeAll(async ({ api }) => {
    ctx = await setupConsultationContext(api, {
      givenName: 'ReportTest',
      familyName: 'NotifiableDisease',
      gender: 'male',
      birthDate: '1990-01-01',
    });
    const { body: allergyResponse } = await api.fhir.submitEncounterBundle(buildAllergyBundle(ctx));
    const encounterUuid = extractFirstUuidFromBundle(allergyResponse, 'Encounter');
    await api.fhir.submitEncounterBundle(
      buildMultipleDiagnosisBundle(ctx, encounterUuid, [
        CONDITION_CODES.malaria,
        CONDITION_CODES.dengue,
        CONDITION_CODES.tetanus,
        CONDITION_CODES.typhoidFever,
      ])
    );
  });

  test('Notifiable Diseases report includes all four submitted diagnoses', async ({ api }) => {
    const { status, body } = await api.report.generate({
      name: 'Notifiable Diseases',
      startDate: today(),
      endDate: today(),
    });

    expect(status).toBe(200);
    expect(body).toContain('ReportTest NotifiableDisease');
    expect(body).toContain(formatReportDate(new Date()));
    expect(body).toContain('Malaria');
    expect(body).toContain('Dengue');
    expect(body).toContain('Tetanus');
    expect(body).toContain('Typhoid fever');
  });

  test.afterAll(async ({ api }) => {
    await teardownConsultationContext(api, ctx).catch(() => {});
  });
});

test.describe.serial('Reports — Diagnosis Count Report', { tag: ['@regression', '@onlyLite'] }, () => {
  test.describe.configure({ timeout: 90_000 });

  let ctx: ConsultationContext;
  let baselineAnaemiaMale: number;
  let baselineAnaemiaTotal: number;

  test.beforeAll(async ({ api }) => {
    const { body: baselineBody } = await api.report.generate({
      name: 'Diagnosis Count Report',
      startDate: today(),
      endDate: today(),
    });
    baselineAnaemiaMale = extractDiagnosisCount(baselineBody, 'Anaemia', 'Male');
    baselineAnaemiaTotal = extractDiagnosisCount(baselineBody, 'Anaemia', 'Total');

    ctx = await setupConsultationContext(api, {
      givenName: 'ReportTest',
      familyName: 'DiagnosisCount',
      gender: 'male',
      birthDate: '1990-01-01',
    });
    const { body: allergyBundle } = await api.fhir.submitEncounterBundle(buildAllergyBundle(ctx));
    const encounterUuid = extractFirstUuidFromBundle(allergyBundle, 'Encounter');
    await api.fhir.submitEncounterBundle(buildMultipleDiagnosisBundle(ctx, encounterUuid, [CONDITION_CODES.anaemia]));
  });

  test('Diagnosis Count Report increases Anaemia count after submitting a male patient diagnosis', async ({ api }) => {
    const { status, body } = await api.report.generate({
      name: 'Diagnosis Count Report',
      startDate: today(),
      endDate: today(),
    });

    expect(status).toBe(200);
    expect(body).toContain('Diagnosis');
    expect(body).toContain('Female');
    expect(body).toContain('Male');
    expect(body).toContain('Total');
    expect(extractDiagnosisCount(body, 'Anaemia', 'Male')).toBeGreaterThanOrEqual(baselineAnaemiaMale + 1);
    expect(extractDiagnosisCount(body, 'Anaemia', 'Total')).toBeGreaterThanOrEqual(baselineAnaemiaTotal + 1);
  });

  test.afterAll(async ({ api }) => {
    await teardownConsultationContext(api, ctx).catch(() => {});
  });
});
