/**
 * Allergy test data
 * Contains predefined allergy data for testing
 */

export interface AllergyData {
  allergen: string;
  severity: string;
  reaction: string;
}

// Common allergens available in Bahmni
export const ALLERGENS = {
  PENICILLIN: 'Penicillin',
  ASPIRIN: 'Aspirin',
  PEANUTS: 'Peanuts',
  EGGS: 'Eggs',
  LATEX: 'Latex',
  SULFA: 'Sulfa',
  SEAFOOD: 'Seafood',
} as const;

// Severity levels
export const SEVERITY_LEVELS = {
  MILD: 'Mild',
  MODERATE: 'Moderate',
  SEVERE: 'Severe',
} as const;

// Common reactions
export const REACTIONS = {
  RASH: 'Rash',
  ITCHING: 'Itching',
  HIVES: 'Hives',
  SWELLING: 'Swelling',
  ANAPHYLAXIS: 'Anaphylaxis',
  NAUSEA: 'Nausea',
  VOMITING: 'Vomiting',
  DIARRHEA: 'Diarrhea',
} as const;

/**
 * Generate allergy test data
 * @param allergen - Allergen name (optional, defaults to Penicillin)
 * @param severity - Severity level (optional, defaults to Mild)
 * @param reaction - Reaction type (optional, defaults to Rash)
 */
export function generateAllergyData(
  allergen: string = ALLERGENS.PENICILLIN,
  severity: string = SEVERITY_LEVELS.MILD,
  reaction: string = REACTIONS.RASH
): AllergyData {
  return {
    allergen,
    severity,
    reaction,
  };
}
