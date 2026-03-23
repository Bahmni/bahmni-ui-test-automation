export const ANEMIA_PANEL_NAME = 'Anemia panel (Panel)';
export const ATYPICAL_LYMPH_NAME = 'Absolute atypical lymphocyte count';

export interface AnemiaReportData {
  effectiveDate: string;
  haemoglobin: { value: number; unit: string };
  hematocrit: { value: number; unit: string };
  peripheralSmear: string;
  sickleCellTest: string;
  reticulocytes: { value: number; unit: string };
  hemoglobinElectrophoresis: string;
  platelets: { value: number; unit: string };
}

export interface AtypicalLymphReportData {
  effectiveDate: string;
  atypicalLymphCount: { value: number; unit: string };
}

export const atypicalLymphReportData: AtypicalLymphReportData = {
  effectiveDate: '2026-02-24',
  atypicalLymphCount: { value: 12, unit: '10^3/uL' },
};

export const anemiaReportData: AnemiaReportData = {
  effectiveDate: '2026-02-18',
  haemoglobin: { value: 7.2, unit: 'g/dL' },
  hematocrit: { value: 25.1, unit: '%' },
  peripheralSmear: 'Microcytic hypochromic red cells with anisocytosis and poikilocytosis noted',
  sickleCellTest: 'Positive',
  reticulocytes: { value: 8, unit: '%' },
  hemoglobinElectrophoresis: 'HbSS pattern detected — consistent with sickle cell disease',
  platelets: { value: 89, unit: '10^3/mL' },
};
