import { test, expect } from '../../../../src/api/fixtures/apiFixture';
import {
  buildTBProgramEnrollmentPayload,
  TB_PROGRAM,
  todayAtMidnightIst,
} from '../../../../test-data/api/programEnrollmentPayload';
import {
  ConsultationContext,
  setupConsultationContext,
  teardownConsultationContext,
} from '../../../../src/api/helpers/consultationSetup';

function todayDateOnly(): string {
  return new Date().toISOString().split('T')[0];
}

const TEST_VALUES = {
  idNumber: '9839',
  treatmentDate: todayDateOnly(),
  doctorInCharge: 'Arun',
  patientStageUuid: TB_PROGRAM.patientStageValueUuid,
};

test.describe.serial('POST + GET /bahmniprogramenrollment — TB Program enrollment', { tag: ['@regression'] }, () => {
  let ctx: ConsultationContext;
  let enrollmentUuid: string;
  let skipReason: string | undefined;

  test.beforeAll(async ({ api }) => {
    ctx = await setupConsultationContext(api);
    const programPresent = await api.program.programExists(TB_PROGRAM.uuid);
    if (!programPresent) {
      skipReason = `TB Program (${TB_PROGRAM.uuid}) not found on this server — spec is hardcoded for Bahmni Standard config`;
    }
  });

  test(
    'POST /bahmniprogramenrollment — enroll patient in TB Program with initial state and attributes',
    { tag: '@onlyStandard' },
    async ({ api }) => {
      test.skip(skipReason !== undefined, skipReason);
      const dateEnrolled = todayAtMidnightIst();
      const payload = buildTBProgramEnrollmentPayload(ctx.patientUuid, dateEnrolled, TEST_VALUES);
      const { status, body } = await api.program.enroll(payload);

      expect([200, 201]).toContain(status);
      expect(body.uuid).toBeTruthy();
      expect(body.patient.uuid).toBe(ctx.patientUuid);
      expect(body.program.uuid).toBe(TB_PROGRAM.uuid);
      expect(body.dateEnrolled).toBeTruthy();
      expect(body.states.length).toBe(1);
      expect(body.states[0].state.uuid).toBe(TB_PROGRAM.initialStateUuid);
      expect(body.attributes.length).toBe(4);

      enrollmentUuid = body.uuid;
    }
  );

  test(
    'GET /bahmniprogramenrollment?patient={uuid}&v=custom:(...) — returns the enrollment with program, initial state, and 4 attributes',
    { tag: '@onlyStandard' },
    async ({ api }) => {
      test.skip(skipReason !== undefined, skipReason);
      const { status, body } = await api.program.getByPatientCustom(ctx.patientUuid, 5);

      expect(status).toBe(200);
      expect(body.totalCount).toBe(1);
      expect(body.results.length).toBe(1);

      const enrollment = body.results[0];
      expect(enrollment.uuid).toBe(enrollmentUuid);
      expect(enrollment.patient.uuid).toBe(ctx.patientUuid);
      expect(enrollment.program.uuid).toBe(TB_PROGRAM.uuid);
      expect(enrollment.program.name).toBe(TB_PROGRAM.name);
      expect(enrollment.episodeUuid).toBeTruthy();

      expect(enrollment.states.length).toBe(1);
      const initialState = enrollment.states[0];
      expect(initialState.state.uuid).toBe(TB_PROGRAM.initialStateUuid);
      expect(initialState.state.concept?.display).toBe(TB_PROGRAM.initialStateConceptDisplay);
      expect(initialState.endDate).toBeNull();

      expect(enrollment.attributes.length).toBe(4);
      const attrByType = (typeUuid: string) => enrollment.attributes.find((a) => a.attributeType?.uuid === typeUuid);

      expect(attrByType(TB_PROGRAM.attributeTypes.idNumber)?.value).toBe(TEST_VALUES.idNumber);
      expect(attrByType(TB_PROGRAM.attributeTypes.doctorInCharge)?.value).toBe(TEST_VALUES.doctorInCharge);
      const stageAttr = attrByType(TB_PROGRAM.attributeTypes.patientStage);
      expect(typeof stageAttr?.value === 'object' && stageAttr?.value?.uuid).toBe(TB_PROGRAM.patientStageValueUuid);
    }
  );

  test.afterAll(async ({ api }) => {
    await teardownConsultationContext(api, ctx);
  });
});
