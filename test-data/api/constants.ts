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
  routeIntravenous: 'd4631c91-5e07-11ef-8f7c-0242ac120002',
  routeIntramuscular: 'd4627331-5e07-11ef-8f7c-0242ac120002',
  routeSubcutaneous: '160245AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  routePerVaginal: 'd46382f3-5e07-11ef-8f7c-0242ac120002',
  routePerRectum: 'd463e5fc-5e07-11ef-8f7c-0242ac120002',
  routeSublingual: '165519AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  routeNasogastric: 'd464733f-5e07-11ef-8f7c-0242ac120002',
  routeIntradermal: 'd55f8c66-5e07-11ef-8f7c-0242ac120002',
  routeIntraperitoneal: 'd55fdd24-5e07-11ef-8f7c-0242ac120002',
  routeIntrathecal: 'd5602ce2-5e07-11ef-8f7c-0242ac120002',
  routeIntraosseous: 'd5607904-5e07-11ef-8f7c-0242ac120002',
  routeTopical: 'd5d3db65-5e07-11ef-8f7c-0242ac120002',
  routeNasal: 'd5d40e6d-5e07-11ef-8f7c-0242ac120002',
  routeInhalation: 'd5d43f88-5e07-11ef-8f7c-0242ac120002',
  doseUnitTablet: '1513AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  doseUnitCapsule: '1608AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  doseUnitMl: '162263AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  doseUnitMg: '161553AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  doseUnitIU: '162264AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  doseUnitDrop: '162356AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  doseUnitTablespoon: '162378AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  doseUnitTeaspoon: '162379AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  doseUnitUnit: '162381AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  doseUnitPuff: '162372AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  frequencyImmediate: '0',
  frequencyOnceDaily: 'd46af615-5e07-11ef-8f7c-0242ac120002',
  frequencyTwiceDaily: 'd46b555c-5e07-11ef-8f7c-0242ac120002',
  frequencyThriceDaily: 'd46b8d00-5e07-11ef-8f7c-0242ac120002',
  frequencyFourTimesDaily: 'd46bc54c-5e07-11ef-8f7c-0242ac120002',
  frequencyEvery2Hours: 'd5575f24-5e07-11ef-8f7c-0242ac120002',
  frequencyEvery4Hours: 'd55822a0-5e07-11ef-8f7c-0242ac120002',
  frequencyEvery6Hours: 'd5588018-5e07-11ef-8f7c-0242ac120002',
  frequencyEvery8Hours: 'd558e36b-5e07-11ef-8f7c-0242ac120002',
  frequencyEvery12Hours: 'd5593db8-5e07-11ef-8f7c-0242ac120002',
  frequencyAlternateDays: 'd55a1c1c-5e07-11ef-8f7c-0242ac120002',
  frequencyOnceWeekly: 'd55a6bba-5e07-11ef-8f7c-0242ac120002',
  frequencyTwiceWeekly: 'd55ac0e0-5e07-11ef-8f7c-0242ac120002',
  frequencyEvery3Weeks: 'd55b9313-5e07-11ef-8f7c-0242ac120002',
} as const;

export const DURATION_UNITS = {
  minutes: '1733AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  hours: '1822AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  days: '1072AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  weeks: '1073AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  months: '1074AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
} as const;

export const SERVICE_REQUEST_CATEGORIES = {
  lab: 'd3560b17-5e07-11ef-8f7c-0242ac120002',
  radiology: 'd3561dc0-5e07-11ef-8f7c-0242ac120002',
  procedure: '3f224d3e-afd7-4e90-8f14-34cf481b6d0f',
} as const;

export const LAB_CONCEPTS = {
  haemoglobin: '161432AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  plateletCount: '159896AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  anemiaPanel: '161437AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  absoluteImmatureCellCount: '1335AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  completeBloodCount: '1019AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  sickleCell: '160225AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  peripheralSmear: '161423AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  hemoglobinElectrophoresis: '161421AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  hivTest: '1356AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
} as const;

export const RADIOLOGY_CONCEPTS = {
  echocardiogram: '159567AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  xRaySkullFourViews: '161339AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
} as const;

export const PROCEDURE_CONCEPTS = {
  reconstructionProcedure: '166790AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
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
