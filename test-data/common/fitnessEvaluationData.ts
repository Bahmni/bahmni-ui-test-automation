/**
 * Fitness Evaluation observation form test data
 */

// Fitness evaluation data type
export interface FitnessEvaluationData {
  heightCm: string;
  weightKg: string;
  pulse: string;
  supplementStatus: string;
  pregnancyStatus: string;
}

export const fitnessEvaluationFaker = {
  /**
   * Generate a simple fitness evaluation with values within the form's normal ranges.
   * Supplement Status is required for all patients, Pregnancy Status is additionally
   * required for female patients by the form's own validation, so both are always filled.
   */
  simpleFitnessEvaluation: (): FitnessEvaluationData => ({
    heightCm: '170',
    weightKg: '65',
    pulse: '72',
    supplementStatus: 'Completed',
    pregnancyStatus: 'No',
  }),
};
