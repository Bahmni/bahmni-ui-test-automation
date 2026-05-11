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

export const X_RAY_ARM_NAME = 'X-ray, arm';

export interface XRayArmReportData {
  effectiveDate: string;
  summary: string;
  impression: string;
  radiologyNotes: string;
  radiologyResults: string;
  swellingPresent: 'Yes' | 'No';
  boneTenderness: 'Yes' | 'No' | 'Unknown';
  injuryPresent: 'Yes' | 'No';
  armLengthDiscrepancyCm: number;
}

export const xRayArmReportData: XRayArmReportData = {
  effectiveDate: '2026-05-01',
  summary: 'No fracture or dislocation detected. Bone cortex intact bilaterally. Soft tissue planes unremarkable.',
  impression: 'Normal arm X-ray. No acute bony abnormality detected.',
  radiologyNotes: 'AP and lateral views obtained. Recommend clinical follow-up if symptoms persist.',
  radiologyResults: 'Cortical margins intact. Joint spaces preserved. No periosteal reaction.',
  swellingPresent: 'No',
  boneTenderness: 'No',
  injuryPresent: 'No',
  armLengthDiscrepancyCm: 0.2,
};

export const ECHOCARDIOGRAM_NAME = 'Echocardiogram';

export interface EchocardiogramReportData {
  effectiveDate: string;
  summary: string;
  impression: string;
  radiologyNotes: string;
  ejectionFraction: { value: number; unit: string };
  echocardiogramComment: string;
  leftVentricularSystolicFunction: string;
  leftVentricularVolume: string;
  heartAndGreatVessels: string;
  noPericardialEffusion: string;
  radiologyResults: string;
  cardiacExamination: string;
  improvementSeen: string;
  combinedVentricularSize: { value: number; unit: string };
  evidenceOfCardiacEnlargement: string;
  abnormalHeartSounds: string;
}

export const echocardiogramReportData: EchocardiogramReportData = {
  effectiveDate: '2026-03-05',
  summary: 'Mild mitral regurgitation. Left ventricular function preserved. No significant wall motion abnormality.',
  impression: 'Mild MR, clinically insignificant. Overall cardiac function within normal limits.',
  radiologyNotes: 'Annual follow-up recommended. No urgent intervention required.',
  ejectionFraction: { value: 35, unit: '%' },
  echocardiogramComment: 'Good acoustic window. Study technically adequate.',
  leftVentricularSystolicFunction: 'Normal ejection fraction',
  leftVentricularVolume: 'Normal',
  heartAndGreatVessels: 'Mild mitral regurgitation. No stenosis detected.',
  noPericardialEffusion: 'Confirmed. No pericardial effusion identified.',
  radiologyResults: 'Regular rate and rhythm. No additional heart sounds.',
  cardiacExamination: 'S1 and S2 normal. Soft systolic murmur at apex. No gallop.',
  improvementSeen: 'Yes',
  combinedVentricularSize: { value: 48, unit: 'mm' },
  evidenceOfCardiacEnlargement: 'No evidence of cardiac enlargement.',
  abnormalHeartSounds: 'Soft systolic murmur at apex, consistent with mild MR.',
};
