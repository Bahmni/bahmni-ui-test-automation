// Hardcoded UUIDs for the TB Program on the Bahmni Standard config.
// This spec is a low-priority sanity test and these UUIDs change per environment.
export const TB_PROGRAM = {
  uuid: '0b91e74a-0cce-43bd-93bc-21ad1d3aeb2a',
  name: 'TB Program',
  initialStateUuid: '4a8e173f-7e0d-4ffe-928f-bdeb16aa58b9',
  initialStateConceptDisplay: 'initial phase, tuberculosis treatment',
  attributeTypes: {
    idNumber: '435e6fa9-45af-428b-a7e5-cef7c1929928',
    treatmentDate: 'ac3a1304-e290-4017-bb0a-8179263eb7b5',
    doctorInCharge: '5b38aa5c-569f-4869-956f-6820ea5a3c8d',
    patientStage: '13bedad6-104b-40bf-bc6a-b1905c3e7750',
  },
  patientStageValueUuid: '8e8536ed-67fe-488e-8ae3-bdcf8b3a2128',
} as const;

export interface ProgramEnrollmentTestValues {
  idNumber: string;
  treatmentDate: string;
  doctorInCharge: string;
  patientStageUuid: string;
}

export function buildTBProgramEnrollmentPayload(
  patientUuid: string,
  dateEnrolledIso: string,
  values: ProgramEnrollmentTestValues
): Record<string, unknown> {
  return {
    patient: patientUuid,
    program: TB_PROGRAM.uuid,
    dateEnrolled: dateEnrolledIso,
    attributes: [
      { attributeType: { uuid: TB_PROGRAM.attributeTypes.idNumber }, value: values.idNumber },
      { attributeType: { uuid: TB_PROGRAM.attributeTypes.treatmentDate }, value: values.treatmentDate },
      { attributeType: { uuid: TB_PROGRAM.attributeTypes.doctorInCharge }, value: values.doctorInCharge },
      { attributeType: { uuid: TB_PROGRAM.attributeTypes.patientStage }, value: values.patientStageUuid },
    ],
    states: [{ state: TB_PROGRAM.initialStateUuid, startDate: dateEnrolledIso }],
  };
}

export function todayAtMidnightIst(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(
    2,
    '0'
  )}T00:00:00+0530`;
}
