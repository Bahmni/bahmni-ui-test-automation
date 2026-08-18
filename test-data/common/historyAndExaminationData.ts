/**
 * History and Examination observation form test data
 */

export interface HistoryAndExaminationData {
  chiefComplaint?: string;
  duration?: string;
  durationUnit?: string;
  // Adds a second Chief Complaint Record block (via "Add more") alongside chiefComplaint.
  additionalChiefComplaint?: string;
  additionalDuration?: string;
  additionalDurationUnit?: string;
  historyOfPresentIllness?: string;
  smokingStatus?: string;
}

export const historyAndExaminationFaker = {
  simpleHistoryAndExamination: (): HistoryAndExaminationData => ({
    chiefComplaint: 'Fever',
    duration: '2',
    durationUnit: 'Days',
    historyOfPresentIllness: 'Patient reports mild fever and headache for the past two days.',
    smokingStatus: 'Never smoker',
  }),

  /**
   * Values used to edit a previously saved History and Examination form,
   * distinct from simpleHistoryAndExamination() so the edit test can assert the change.
   */
  editedHistoryAndExamination: (): HistoryAndExaminationData => ({
    duration: '5',
    durationUnit: 'Days',
    additionalChiefComplaint: 'Cough',
    additionalDuration: '1',
    additionalDurationUnit: 'Days',
    historyOfPresentIllness: 'Fever has persisted for five days and is now accompanied by a cough.',
    smokingStatus: 'Former smoker',
  }),
};
