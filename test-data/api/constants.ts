export const IDENTIFIER = {
  sourceUuid: process.env.IDENTIFIER_SOURCE_UUID || 'c5cf4b68-6529-43fc-a644-c775ae73745e',
  typeUuid: process.env.IDENTIFIER_TYPE_UUID || 'd3153eb0-5e07-11ef-8f7c-0242ac120002',
  prefix: process.env.IDENTIFIER_PREFIX || 'ABC',
} as const;

export const PERSON_ATTRIBUTE_TYPE = {
  phoneNumber: 'a384873b-847a-4a86-b869-28fb601162dd',
  alternatePhoneNumber: '27fa84ff-fdd6-4895-9c77-254b60555f39',
  email: 'e3123cba-5e07-11ef-8f7c-0242ac120002',
} as const;

export const VISIT_TYPES = {
  opd: 'OPD',
} as const;

export const LOCATIONS = {
  opd1: 'OPD-1',
  loginLocationUuid: '5e232c47-8ff5-4c5c-8057-7e39a64fefa5',
} as const;

export const ENCOUNTER_TYPES = {
  consultation: 'd34fe3ab-5e07-11ef-8f7c-0242ac120002',
} as const;

export const DRUG_ORDER = {
  routeOral: 'd4634f75-5e07-11ef-8f7c-0242ac120002',
  doseUnitTablet: '1513AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  frequencyImmediate: '0',
} as const;

export const SERVICE_REQUEST_CATEGORIES = {
  lab: '3f224d3e-afd7-4e90-8f14-34cf481b6d0f',
  radiology: 'd3561dc0-5e07-11ef-8f7c-0242ac120002',
} as const;

export const LAB_CONCEPTS = {
  haemoglobin: '161432AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  plateletCount: '159896AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  // Panel concept used by the UI's "Anemia panel (Panel)" investigation order — required
  // for the DiagnosticReport $submit-bundle flow which expects an order matching the panel.
  anemiaPanel: '161437AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
} as const;

export const VITALS_CONCEPTS = {
  pulse: '5087AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  spO2: '5092AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  respiratoryRate: '5242AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  temperature: '9bb0795c-4ff0-0305-1990-000000000020',
  bpSystolic: '5085AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  bpDiastolic: '5086AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  bpBodyPosition: '159633AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  bloodPressureGroup: '631f9e92-b15f-41da-a6ba-4f4cd67f36b7',
} as const;

export const HE_CONCEPTS = {
  chiefComplaintGroup: 'da47a35d-5806-48b7-b467-e29902759491',
  chiefComplaint: '9bb0795c-4ff0-0305-1990-000000000002',
  duration: '1731AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  durationUnit: '9bb0795c-4ff0-0305-1990-000000000003',
  historyOfIllness: '1390AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
} as const;

export const ALLERGY_CODES = {
  penicillin: '162543AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  aspirin: '71617AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
} as const;

export const ALLERGY_REACTION_CODES = {
  rash: '121629AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
} as const;

// FHIR ValueSet UUIDs for allergen concept lists (food/medication/environment/biologic)
export const ALLERGY_VALUE_SETS = {
  food: '162552AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  medication: '162553AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  environment: '162554AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  biologic: '162555AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
} as const;

// FHIR default page size when client does not specify _count
export const FHIR_DEFAULT_PAGE_SIZE = 10 as const;

export const CONDITION_CODES = {
  malaria: '940AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  anaemia: '145119AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
} as const;

// Concept codes used as observation values (valueCodeableConcept)
export const FHIR_CODED_VALUES = {
  fever: { code: '140238AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'Fever' },
  hours: { code: '1822AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'Hours' },
  sitting: { code: '159630AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'sitting' },
} as const;

// Default values used by the vitals bundle builder; tests assert against these
export const VITALS_VALUES = {
  pulse: 80,
  spO2: 98,
  respiratoryRate: 16,
  temperature: 37,
  bpSystolic: 120,
  bpDiastolic: 80,
} as const;

// Default values used by the H&E bundle builder; tests assert against these
export const HE_VALUES = {
  durationDays: 3,
  historyText: 'Patient has had fever for 3 days',
} as const;

export const SERVER_PAGE_MAX = 100 as const;
