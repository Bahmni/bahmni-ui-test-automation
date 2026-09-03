function env(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not set — run globalSetup before tests`);
  return value;
}

export const IDENTIFIER = {
  sourceUuid: env('IDENTIFIER_SOURCE_UUID'),
  typeUuid: env('IDENTIFIER_TYPE_UUID'),
  prefix: process.env.IDENTIFIER_PREFIX || 'ABC',
};

export const PERSON_ATTRIBUTE_TYPE = {
  phoneNumber: env('PERSON_ATTR_PHONE_NUMBER'),
  alternatePhoneNumber: env('PERSON_ATTR_ALT_PHONE_NUMBER'),
  email: env('PERSON_ATTR_EMAIL'),
};

export const VISIT_TYPES = {
  opd: 'OPD',
} as const;

export const LOCATIONS = {
  opd1: env('LOCATION_OPD'),
  loginLocationUuid: env('LOCATION_LOGIN_UUID'),
};

export const ENCOUNTER_TYPES = {
  consultation: env('ENCOUNTER_TYPE_CONSULTATION'),
};

export const DRUG_ORDER = {
  routeOral: env('DRUG_ROUTE_ORAL'),
  routeIntravenous: env('DRUG_ROUTE_INTRAVENOUS'),
  routeIntramuscular: env('DRUG_ROUTE_INTRAMUSCULAR'),
  routeSubcutaneous: env('DRUG_ROUTE_SUBCUTANEOUS'),
  routePerVaginal: env('DRUG_ROUTE_PER_VAGINAL'),
  routePerRectum: env('DRUG_ROUTE_PER_RECTUM'),
  routeSublingual: env('DRUG_ROUTE_SUBLINGUAL'),
  routeNasogastric: env('DRUG_ROUTE_NASOGASTRIC'),
  routeIntradermal: env('DRUG_ROUTE_INTRADERMAL'),
  routeIntraperitoneal: env('DRUG_ROUTE_INTRAPERITONEAL'),
  routeIntrathecal: env('DRUG_ROUTE_INTRATHECAL'),
  routeIntraosseous: env('DRUG_ROUTE_INTRAOSSEOUS'),
  routeTopical: env('DRUG_ROUTE_TOPICAL'),
  routeNasal: env('DRUG_ROUTE_NASAL'),
  routeInhalation: env('DRUG_ROUTE_INHALATION'),
  doseUnitTablet: env('DRUG_DOSE_UNIT_TABLET'),
  doseUnitCapsule: env('DRUG_DOSE_UNIT_CAPSULE'),
  doseUnitMl: env('DRUG_DOSE_UNIT_ML'),
  doseUnitMg: env('DRUG_DOSE_UNIT_MG'),
  doseUnitIU: env('DRUG_DOSE_UNIT_IU'),
  doseUnitDrop: env('DRUG_DOSE_UNIT_DROP'),
  doseUnitTablespoon: env('DRUG_DOSE_UNIT_TABLESPOON'),
  doseUnitTeaspoon: env('DRUG_DOSE_UNIT_TEASPOON'),
  doseUnitUnit: env('DRUG_DOSE_UNIT_UNIT'),
  doseUnitPuff: env('DRUG_DOSE_UNIT_PUFF'),
  frequencyImmediate: process.env.DRUG_FREQ_IMMEDIATE || '0',
  frequencyOnceDaily: env('DRUG_FREQ_ONCE_DAILY'),
  frequencyTwiceDaily: env('DRUG_FREQ_TWICE_DAILY'),
  frequencyThriceDaily: env('DRUG_FREQ_THRICE_DAILY'),
  frequencyFourTimesDaily: env('DRUG_FREQ_FOUR_TIMES_DAILY'),
  frequencyEvery2Hours: env('DRUG_FREQ_EVERY_2_HOURS'),
  frequencyEvery4Hours: env('DRUG_FREQ_EVERY_4_HOURS'),
  frequencyEvery6Hours: env('DRUG_FREQ_EVERY_6_HOURS'),
  frequencyEvery8Hours: env('DRUG_FREQ_EVERY_8_HOURS'),
  frequencyEvery12Hours: env('DRUG_FREQ_EVERY_12_HOURS'),
  frequencyAlternateDays: env('DRUG_FREQ_ALTERNATE_DAYS'),
  frequencyOnceWeekly: env('DRUG_FREQ_ONCE_WEEKLY'),
  frequencyTwiceWeekly: env('DRUG_FREQ_TWICE_WEEKLY'),
  frequencyEvery3Weeks: env('DRUG_FREQ_EVERY_3_WEEKS'),
};

export const DURATION_UNITS = {
  minutes: env('DURATION_UNIT_MINUTES'),
  hours: env('DURATION_UNIT_HOURS'),
  days: env('DURATION_UNIT_DAYS'),
  weeks: env('DURATION_UNIT_WEEKS'),
  months: env('DURATION_UNIT_MONTHS'),
};

export const SERVICE_REQUEST_CATEGORIES = {
  lab: env('SERVICE_REQUEST_CATEGORY_LAB'),
  radiology: env('SERVICE_REQUEST_CATEGORY_RADIOLOGY'),
  // Procedure order type is not configured in bahmni-lite — only used by @onlyStandard tests
  procedure: process.env.SERVICE_REQUEST_CATEGORY_PROCEDURE ?? '',
};

export const LAB_CONCEPTS = {
  haemoglobin: env('LAB_CONCEPT_HAEMOGLOBIN'),
  plateletCount: env('LAB_CONCEPT_PLATELET_COUNT'),
  anemiaPanel: env('LAB_CONCEPT_ANEMIA_PANEL'),
  absoluteImmatureCellCount: env('LAB_CONCEPT_ABSOLUTE_IMMATURE_CELL_COUNT'),
  completeBloodCount: env('LAB_CONCEPT_COMPLETE_BLOOD_COUNT'),
  sickleCell: env('LAB_CONCEPT_SICKLE_CELL'),
  peripheralSmear: env('LAB_CONCEPT_PERIPHERAL_SMEAR'),
  hemoglobinElectrophoresis: env('LAB_CONCEPT_HEMOGLOBIN_ELECTROPHORESIS'),
  hivTest: env('LAB_CONCEPT_HIV_TEST'),
};

export const RADIOLOGY_CONCEPTS = {
  echocardiogram: env('RADIOLOGY_CONCEPT_ECHOCARDIOGRAM'),
  xRaySkullFourViews: env('RADIOLOGY_CONCEPT_XRAY_SKULL'),
  xRayArm: env('RADIOLOGY_CONCEPT_XRAY_ARM'),
};

// Procedure concepts are only used by @onlyStandard tests (not available in bahmni-lite)
export const PROCEDURE_CONCEPTS = {
  reconstructionProcedure: process.env.PROCEDURE_CONCEPT_RECONSTRUCTION ?? '',
};

export const VITALS_CONCEPTS = {
  pulse: env('VITALS_CONCEPT_PULSE'),
  spO2: env('VITALS_CONCEPT_SPO2'),
  respiratoryRate: env('VITALS_CONCEPT_RESPIRATORY_RATE'),
  temperature: env('VITALS_CONCEPT_TEMPERATURE'),
  bpSystolic: env('VITALS_CONCEPT_BP_SYSTOLIC'),
  bpDiastolic: env('VITALS_CONCEPT_BP_DIASTOLIC'),
  bpBodyPosition: env('VITALS_CONCEPT_BP_BODY_POSITION'),
  bloodPressureGroup: env('VITALS_CONCEPT_BP_GROUP'),
};

export const HE_CONCEPTS = {
  chiefComplaintGroup: env('HE_CONCEPT_CHIEF_COMPLAINT_GROUP'),
  chiefComplaint: env('HE_CONCEPT_CHIEF_COMPLAINT'),
  duration: env('HE_CONCEPT_DURATION'),
  durationUnit: env('HE_CONCEPT_DURATION_UNIT'),
  historyOfIllness: env('HE_CONCEPT_HISTORY_OF_ILLNESS'),
};

export const OG_CONCEPTS = {
  fundalHeight: env('OG_CONCEPT_FUNDAL_HEIGHT'),
  paPresentingPart: env('OG_CONCEPT_PA_PRESENTING_PART'),
  fetalHeartRate: env('OG_CONCEPT_FETAL_HEART_RATE'),
  lmp: env('OG_CONCEPT_LMP'),
};

export const DOCUMENT_TYPES = {
  patientFile: env('DOCUMENT_TYPE_PATIENT_FILE'),
};

export const APPOINTMENT_SERVICES = {
  primary: env('APPOINTMENT_SERVICE_UUID'),
};

export const FORM_NAMES = {
  vitals: 'Vitals',
  obstetricsAndGynaecology: 'Obstetrics and Gynaecology',
} as const;

export const FORM_NAMESPACES = {
  vitals: 'Bahmni^Vitals.1',
  obstetricsAndGynaecology: 'Bahmni^Obstetrics and Gynaecology.1',
} as const;

export const FORM_NAMESPACE_EXT_URL = 'http://fhir.bahmni.org/ext/observation/form-namespace-path' as const;

export const ALLERGY_CODES = {
  penicillin: env('ALLERGY_CODE_PENICILLIN'),
  aspirin: env('ALLERGY_CODE_ASPIRIN'),
};

export const ALLERGY_REACTION_CODES = {
  rash: env('ALLERGY_REACTION_CODE_RASH'),
};

// FHIR ValueSet UUIDs for allergen concept lists (food/medication/environment/biologic)
export const ALLERGY_VALUE_SETS = {
  food: env('ALLERGY_VALUE_SET_FOOD'),
  medication: env('ALLERGY_VALUE_SET_MEDICATION'),
  environment: env('ALLERGY_VALUE_SET_ENVIRONMENT'),
  biologic: env('ALLERGY_VALUE_SET_BIOLOGIC'),
};

// FHIR default page size when client does not specify _count
export const FHIR_DEFAULT_PAGE_SIZE = 10 as const;

export const CONDITION_CODES = {
  malaria: env('CONDITION_CODE_MALARIA'),
  anaemia: env('CONDITION_CODE_ANAEMIA'),
  dengue: env('CONDITION_CODE_DENGUE'),
  tetanus: env('CONDITION_CODE_TETANUS'),
  typhoidFever: env('CONDITION_CODE_TYPHOID_FEVER'),
};

// Concept codes used as observation values (valueCodeableConcept)
export const FHIR_CODED_VALUES = {
  fever: { code: env('CODED_VALUE_FEVER'), display: 'Fever' },
  hours: { code: env('CODED_VALUE_HOURS'), display: 'Hours' },
  sitting: { code: env('CODED_VALUE_SITTING'), display: 'Sitting' },
  cephalic: { code: env('CODED_VALUE_CEPHALIC'), display: 'Cephalic' },
};

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

export const OG_VALUES = {
  fundalHeight: 100,
  fetalHeartRate: 95,
} as const;

export const OBS_NOTES = {
  pulseAbnormal: 'abnormal pulse',
  spO2Normal: 'normal saturation',
  temperatureAbnormal: 'manually marking abnormal',
  bpSystolicChild: 'child obs',
  fetalHeartRateNormal: 'normal heart beat',
  paPresentingPartGood: 'Good',
} as const;

export const SERVER_PAGE_MAX = 100 as const;

export const DRUGS = {
  acetaminophenTablet: env('DRUG_ACETAMINOPHEN_TABLET'),
  acetaminophenInjection: env('DRUG_ACETAMINOPHEN_INJECTION'),
  acetaminophenSuppository: env('DRUG_ACETAMINOPHEN_SUPPOSITORY'),
  antiRabiesVaccine: env('DRUG_ANTI_RABIES_VACCINE'),
  insulin: env('DRUG_INSULIN'),
  isoflurane: env('DRUG_ISOFLURANE'),
  nitroglycerin: env('DRUG_NITROGLYCERIN'),
  oralRehydrationSalts: env('DRUG_ORAL_REHYDRATION_SALTS'),
  xylometazoline: env('DRUG_XYLOMETAZOLINE'),
  lidocaineGel: env('DRUG_LIDOCAINE_GEL'),
  clotrimazolePessary: env('DRUG_CLOTRIMAZOLE_PESSARY'),
  thiopental: env('DRUG_THIOPENTAL'),
  amoxicillinCapsule: env('DRUG_AMOXICILLIN_CAPSULE'),
  diltiazem: env('DRUG_DILTIAZEM'),
  epinephrine: env('DRUG_EPINEPHRINE'),
};
