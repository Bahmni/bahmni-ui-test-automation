import { FhirBundle } from '../../src/api/types/fhir.types';

type Attachment = { contentType: string; url: string; title: string };

const LAB_CATEGORY = [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0074', code: 'LAB' }] }];

const ABNORMAL = [
  {
    coding: [
      {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
        code: 'A',
        display: 'Abnormal',
      },
    ],
  },
];

const EFFECTIVE_DATE = '2026-05-01';
const EFFECTIVE_DATETIME = `${EFFECTIVE_DATE}T10:00:00Z`;

function numericObs(
  urnId: string,
  code: string,
  display: string,
  value: number,
  unit: string,
  low: number | null,
  high: number | null,
  patientRef: string,
  abnormal = false
) {
  const resource: Record<string, unknown> = {
    resourceType: 'Observation',
    status: 'final',
    code: { coding: [{ code, display }] },
    subject: { reference: patientRef },
    effectiveDateTime: EFFECTIVE_DATETIME,
    valueQuantity: { value, unit, system: 'http://unitsofmeasure.org', code: unit },
  };
  if (low !== null || high !== null) {
    const range: Record<string, unknown> = {
      type: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/referencerange-meaning',
            code: 'normal',
            display: 'Normal Range',
          },
        ],
      },
    };
    if (low !== null) range.low = { value: low, unit, system: 'http://unitsofmeasure.org', code: unit };
    if (high !== null) range.high = { value: high, unit, system: 'http://unitsofmeasure.org', code: unit };
    resource.referenceRange = [range];
  }
  if (abnormal) resource.interpretation = ABNORMAL;
  return { fullUrl: `urn:uuid:${urnId}`, resource };
}

function codedObs(
  urnId: string,
  code: string,
  display: string,
  valueCode: string,
  valueDisplay: string,
  patientRef: string,
  abnormal = false
) {
  const resource: Record<string, unknown> = {
    resourceType: 'Observation',
    status: 'final',
    code: { coding: [{ code, display }] },
    subject: { reference: patientRef },
    effectiveDateTime: EFFECTIVE_DATETIME,
    valueCodeableConcept: { coding: [{ code: valueCode, display: valueDisplay }] },
  };
  if (abnormal) resource.interpretation = ABNORMAL;
  return { fullUrl: `urn:uuid:${urnId}`, resource };
}

function textObs(urnId: string, code: string, display: string, value: string, patientRef: string) {
  return {
    fullUrl: `urn:uuid:${urnId}`,
    resource: {
      resourceType: 'Observation',
      status: 'final',
      code: { coding: [{ code, display }] },
      subject: { reference: patientRef },
      effectiveDateTime: EFFECTIVE_DATETIME,
      valueString: value,
    },
  };
}

function booleanObs(urnId: string, code: string, display: string, value: boolean, patientRef: string) {
  return {
    fullUrl: `urn:uuid:${urnId}`,
    resource: {
      resourceType: 'Observation',
      status: 'final',
      code: { coding: [{ code, display }] },
      subject: { reference: patientRef },
      effectiveDateTime: EFFECTIVE_DATETIME,
      valueBoolean: value,
    },
  };
}

function drEntry(
  urnId: string,
  serviceRequestId: string,
  code: string,
  display: string,
  patientRef: string,
  encounterRef: string,
  resultUrns: string[],
  attachments: Attachment[] = []
) {
  const resource: Record<string, unknown> = {
    resourceType: 'DiagnosticReport',
    basedOn: [{ reference: `ServiceRequest/${serviceRequestId}` }],
    status: 'final',
    category: LAB_CATEGORY,
    code: { coding: [{ code, display }] },
    subject: { reference: patientRef },
    encounter: { reference: encounterRef },
    effectiveDateTime: EFFECTIVE_DATE,
  };
  if (resultUrns.length > 0) resource.result = resultUrns.map((ref) => ({ reference: ref }));
  if (attachments.length > 0) resource.presentedForm = attachments;
  return { fullUrl: `urn:uuid:${urnId}`, resource };
}

function drBundle(entries: FhirBundle['entry']): FhirBundle {
  return { resourceType: 'Bundle', type: 'collection', entry: entries };
}

export function buildAbsoluteImmatureCellCountDRBundle(
  patientUuid: string,
  encounterUuid: string,
  serviceRequestId: string
): FhirBundle {
  const patientRef = `Patient/${patientUuid}`;
  return drBundle([
    drEntry(
      'dr-imm-cell',
      serviceRequestId,
      '1335AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'Absolute immature cell count',
      patientRef,
      `Encounter/${encounterUuid}`,
      ['urn:uuid:obs-imm-cell']
    ),
    numericObs(
      'obs-imm-cell',
      '1335AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'Absolute immature cell count',
      8,
      '10^3/uL',
      0,
      1000,
      patientRef
    ),
  ]);
}

export function buildCompleteBloodCountDRBundle(
  patientUuid: string,
  encounterUuid: string,
  serviceRequestId: string
): FhirBundle {
  const patientRef = `Patient/${patientUuid}`;
  const resultUrns = [
    'urn:uuid:obs-hgb',
    'urn:uuid:obs-hct',
    'urn:uuid:obs-mchc',
    'urn:uuid:obs-mcv',
    'urn:uuid:obs-plt',
    'urn:uuid:obs-wbc',
  ];
  return drBundle([
    drEntry(
      'dr-cbc',
      serviceRequestId,
      '1019AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'Complete blood count',
      patientRef,
      `Encounter/${encounterUuid}`,
      resultUrns
    ),
    numericObs('obs-hgb', '21AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'Haemoglobin', 14.5, 'g/dL', 10.4, 17.8, patientRef),
    numericObs('obs-hct', '1015AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'Hematocrit', 42.0, '%', 32.3, 51.9, patientRef),
    numericObs(
      'obs-mchc',
      '1017AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'Mean cell hemoglobin concentration',
      34.5,
      'g/dL',
      33.0,
      37.0,
      patientRef
    ),
    numericObs(
      'obs-mcv',
      '851AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'Mean corpuscular volume',
      88.0,
      'fL',
      80.0,
      100.0,
      patientRef
    ),
    numericObs(
      'obs-plt',
      '729AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'Platelets',
      250.0,
      '10^3/mL',
      134.0,
      419.0,
      patientRef
    ),
    numericObs(
      'obs-wbc',
      '678AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'White blood cells',
      7.5,
      '10^3/uL',
      4.0,
      11.0,
      patientRef
    ),
  ]);
}

export function buildSickleCellDRBundle(
  patientUuid: string,
  encounterUuid: string,
  serviceRequestId: string,
  attachment: Attachment
): FhirBundle {
  const patientRef = `Patient/${patientUuid}`;
  return drBundle([
    drEntry(
      'dr-sickle',
      serviceRequestId,
      '160225AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'Sickle cell screening test',
      patientRef,
      `Encounter/${encounterUuid}`,
      ['urn:uuid:obs-sickle'],
      [attachment]
    ),
    codedObs(
      'obs-sickle',
      '160225AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'Sickle cell screening test',
      '703AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'Positive',
      patientRef,
      true
    ),
  ]);
}

export function buildAnemiaPanelDRBundle(
  patientUuid: string,
  encounterUuid: string,
  serviceRequestId: string,
  attachments: Attachment[]
): FhirBundle {
  const patientRef = `Patient/${patientUuid}`;
  const resultUrns = [
    'urn:uuid:obs-ap-hgb',
    'urn:uuid:obs-ap-hct',
    'urn:uuid:obs-ap-smear',
    'urn:uuid:obs-ap-sickle',
    'urn:uuid:obs-ap-retic',
    'urn:uuid:obs-ap-electro',
    'urn:uuid:obs-ap-plt',
  ];
  return drBundle([
    drEntry(
      'dr-anemia',
      serviceRequestId,
      '161437AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'Anemia panel',
      patientRef,
      `Encounter/${encounterUuid}`,
      resultUrns,
      attachments
    ),
    numericObs(
      'obs-ap-hgb',
      '21AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'Haemoglobin',
      7.2,
      'g/dL',
      10.4,
      17.8,
      patientRef,
      true
    ),
    numericObs(
      'obs-ap-hct',
      '1015AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'Hematocrit',
      25.1,
      '%',
      32.3,
      51.9,
      patientRef,
      true
    ),
    textObs(
      'obs-ap-smear',
      '161423AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'Peripheral smear for RBC morphology',
      'Microcytic hypochromic red cells with anisocytosis and poikilocytosis noted',
      patientRef
    ),
    codedObs(
      'obs-ap-sickle',
      '160225AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'Sickle cell screening test',
      '703AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'Positive',
      patientRef,
      true
    ),
    numericObs(
      'obs-ap-retic',
      '1327AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'Reticulocytes (%)',
      8,
      '%',
      null,
      null,
      patientRef
    ),
    textObs(
      'obs-ap-electro',
      '161421AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'Hemoglobin electrophoresis',
      'HbSS pattern detected — consistent with sickle cell disease',
      patientRef
    ),
    numericObs(
      'obs-ap-plt',
      '729AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'Platelets',
      89,
      '10^3/mL',
      134.0,
      419.0,
      patientRef,
      true
    ),
  ]);
}

export function buildPeripheralSmearDRBundle(
  patientUuid: string,
  encounterUuid: string,
  serviceRequestId: string,
  attachment: Attachment
): FhirBundle {
  const patientRef = `Patient/${patientUuid}`;
  return drBundle([
    drEntry(
      'dr-smear',
      serviceRequestId,
      '161423AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'Peripheral smear for RBC morphology',
      patientRef,
      `Encounter/${encounterUuid}`,
      [],
      [attachment]
    ),
  ]);
}

export function buildHemoglobinElectrophoresisDRBundle(
  patientUuid: string,
  encounterUuid: string,
  serviceRequestId: string
): FhirBundle {
  const patientRef = `Patient/${patientUuid}`;
  return drBundle([
    drEntry(
      'dr-electro',
      serviceRequestId,
      '161421AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'Hemoglobin electrophoresis',
      patientRef,
      `Encounter/${encounterUuid}`,
      ['urn:uuid:obs-electro']
    ),
    textObs(
      'obs-electro',
      '161421AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'Hemoglobin electrophoresis',
      'HbAA pattern — normal hemoglobin, no sickling variant detected',
      patientRef
    ),
  ]);
}

export function buildHivTestDRBundle(patientUuid: string, encounterUuid: string, serviceRequestId: string): FhirBundle {
  const patientRef = `Patient/${patientUuid}`;
  return drBundle([
    drEntry(
      'dr-hiv',
      serviceRequestId,
      '1356AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'HIV Test',
      patientRef,
      `Encounter/${encounterUuid}`,
      ['urn:uuid:obs-hiv']
    ),
    booleanObs('obs-hiv', '1356AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'HIV Test', false, patientRef),
  ]);
}
