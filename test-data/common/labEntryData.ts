export const CBC_ORDER_NAME = 'CBC';
export const CBC_INVESTIGATION_NAME = 'Complete blood count (Panel)';
export const TSH_ORDER_NAME = 'TSH test';
export const TSH_INVESTIGATION_NAME = 'Thyroid stimulating hormone test';

// OpenMRS concept UUIDs — used as stable id prefixes for the value inputs in the CBC panel form.
export const CBC_CONCEPT_UUIDS = {
  hematocrit: '1015AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  haemoglobin: '21AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  mchc: '1017AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  mch: '1018AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  mcv: '851AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  platelets: '729AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  rbc: '679AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  rdw: '1016AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  wbc: '678AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  neutrophils: '1336AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  lymphocytes: '1338AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  mixed: '163426AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
} as const;

export const TSH_CONCEPT_UUID = '161505AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

export interface LabValueEntry {
  value: number;
  unit: string;
  abnormal?: boolean;
}

export interface CbcPanelResults {
  hematocrit: LabValueEntry;
  haemoglobin: LabValueEntry;
  mchc: LabValueEntry;
  mch: LabValueEntry;
  mcv: LabValueEntry;
  platelets: LabValueEntry;
  rbc: LabValueEntry;
  rdw: LabValueEntry;
  wbc: LabValueEntry;
  neutrophils: LabValueEntry;
  lymphocytes: LabValueEntry;
  mixed: LabValueEntry;
}

// Mix of in-range (hematocrit/mchc/mch/mcv/rbc/rdw/mixed) and out-of-range (haemoglobin/platelets/wbc) values so
// the assertions cover both "normal" and "abnormal" flags surfaced by the Bahmni lab entry UI.
export const cbcPanelResults: CbcPanelResults = {
  hematocrit: { value: 45, unit: '%' },
  haemoglobin: { value: 8.5, unit: 'g/dL', abnormal: true },
  mchc: { value: 34, unit: 'g/dL' },
  mch: { value: 30, unit: 'pg' },
  mcv: { value: 90, unit: 'fL' },
  platelets: { value: 500, unit: '10^3/mL', abnormal: true },
  rbc: { value: 5, unit: '10^6/uL' },
  rdw: { value: 15, unit: '%' },
  wbc: { value: 15, unit: '10^3/uL', abnormal: true },
  neutrophils: { value: 60, unit: '%' },
  lymphocytes: { value: 30, unit: '%' },
  mixed: { value: 5, unit: '%' },
};

export const tshResult: LabValueEntry = { value: 3.4, unit: 'mcg/L' };
