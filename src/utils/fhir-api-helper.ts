import { APIRequestContext } from '@playwright/test';
import { config } from '../config/env.config';
import { AnemiaReportData, AtypicalLymphReportData, EchocardiogramReportData } from '../../test-data/labOrderData';

export class FhirApiHelper {
  private readonly fhirBaseUrl: string;

  constructor(private readonly request: APIRequestContext) {
    this.fhirBaseUrl = `${config.baseUrl}/openmrs/ws/fhir2/R4`;
  }

  /**
   * Extracts the patient UUID from a clinical page URL
   * Expected URL pattern: /bahmni-new/clinical/{patientUuid}
   */
  getPatientUuidFromUrl(pageUrl: string): string {
    const match = pageUrl.match(/\/clinical\/([a-f0-9-]+)/);
    if (!match) throw new Error(`Could not extract patient UUID from URL: ${pageUrl}`);
    return match[1];
  }

  /**
   * Fetches the UUID of the most recent encounter for a given patient
   */
  async getLatestEncounterUuid(patientUuid: string): Promise<string> {
    const response = await this.request.get(
      `${this.fhirBaseUrl}/Encounter?patient=${patientUuid}&_sort=-date&_count=1`,
      { headers: this.getAuthHeaders() }
    );
    const bundle = await response.json();
    if (!bundle.entry || bundle.entry.length === 0) {
      throw new Error(`No encounters found for patient ${patientUuid}`);
    }
    return bundle.entry[0].resource.id;
  }

  /**
   * Fetches the UUID of the most recent ServiceRequest for a given patient
   */
  async getLatestServiceRequestUuid(patientUuid: string): Promise<string> {
    const uuids = await this.getLatestServiceRequestUuids(patientUuid, 1);
    return uuids[0];
  }

  async getLatestServiceRequestUuids(patientUuid: string, count: number): Promise<string[]> {
    const response = await this.request.get(
      `${this.fhirBaseUrl}/ServiceRequest?patient=${patientUuid}&_sort=-date&_count=${count}`,
      { headers: this.getAuthHeaders() }
    );
    const bundle = await response.json();
    if (!bundle.entry || bundle.entry.length === 0) {
      throw new Error(`No service requests found for patient ${patientUuid}`);
    }
    return bundle.entry.map((e: { resource: { id: string } }) => e.resource.id);
  }

  /**
   * Posts a FHIR DiagnosticReport bundle for the Anemia panel
   */
  async postAnemiaReport(
    patientUuid: string,
    encounterUuid: string,
    serviceRequestUuid: string,
    reportData: AnemiaReportData
  ): Promise<void> {
    const bundle = this.buildAnemiaBundle(patientUuid, encounterUuid, serviceRequestUuid, reportData);
    const response = await this.request.post(`${this.fhirBaseUrl}/DiagnosticReport/$submit-bundle`, {
      data: bundle,
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/fhir+json' },
    });
    if (!response.ok()) {
      throw new Error(`Failed to post diagnostic report: ${response.status()} ${await response.text()}`);
    }
  }

  async postAtypicalLymphReport(
    patientUuid: string,
    encounterUuid: string,
    serviceRequestUuid: string,
    reportData: AtypicalLymphReportData
  ): Promise<void> {
    const bundle = this.buildAtypicalLymphBundle(patientUuid, encounterUuid, serviceRequestUuid, reportData);
    const response = await this.request.post(`${this.fhirBaseUrl}/DiagnosticReport/$submit-bundle`, {
      data: bundle,
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/fhir+json' },
    });
    if (!response.ok()) {
      throw new Error(`Failed to post diagnostic report: ${response.status()} ${await response.text()}`);
    }
  }

  async postEchocardiogramReport(
    patientUuid: string,
    encounterUuid: string,
    serviceRequestUuid: string,
    reportData: EchocardiogramReportData
  ): Promise<void> {
    const bundle = this.buildEchocardiogramBundle(patientUuid, encounterUuid, serviceRequestUuid, reportData);
    const response = await this.request.post(`${this.fhirBaseUrl}/DiagnosticReport/$submit-bundle`, {
      data: bundle,
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/fhir+json' },
    });
    if (!response.ok()) {
      throw new Error(`Failed to post echocardiogram report: ${response.status()} ${await response.text()}`);
    }
  }

  private buildEchocardiogramBundle(
    patientUuid: string,
    encounterUuid: string,
    serviceRequestUuid: string,
    reportData: EchocardiogramReportData
  ) {
    const effectiveDateTime = `${reportData.effectiveDate}T08:02:46.000Z`;
    const patientRef = `Patient/${patientUuid}`;
    const encounterRef = `Encounter/${encounterUuid}`;
    const abnormalInterpretation = [
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

    return {
      resourceType: 'Bundle',
      type: 'collection',
      entry: [
        {
          fullUrl: 'urn:uuid:dr-echocardiogram',
          resource: {
            resourceType: 'DiagnosticReport',
            basedOn: [{ reference: `ServiceRequest/${serviceRequestUuid}` }],
            status: 'final',
            category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0074', code: 'LAB' }] }],
            code: {
              coding: [{ code: '159567AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'Echocardiogram' }],
              text: 'Echocardiogram',
            },
            subject: { reference: patientRef },
            encounter: { reference: encounterRef },
            result: [
              { reference: 'urn:uuid:obs-summary' },
              { reference: 'urn:uuid:obs-impression' },
              { reference: 'urn:uuid:obs-radiology-notes' },
              { reference: 'urn:uuid:obs-ejection-fraction' },
              { reference: 'urn:uuid:obs-echo-comment' },
              { reference: 'urn:uuid:obs-lv-systolic' },
              { reference: 'urn:uuid:obs-lv-volume' },
              { reference: 'urn:uuid:obs-heart-great-vessels' },
              { reference: 'urn:uuid:obs-pericardial' },
              { reference: 'urn:uuid:obs-radiology-results' },
              { reference: 'urn:uuid:obs-cardiac-exam' },
              { reference: 'urn:uuid:obs-improvement' },
              { reference: 'urn:uuid:obs-ventricular-size' },
              { reference: 'urn:uuid:obs-cardiac-enlargement' },
              { reference: 'urn:uuid:obs-abnormal-sounds' },
            ],
          },
        },
        {
          fullUrl: 'urn:uuid:obs-summary',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: { coding: [{ code: 'cf1844e6-d734-4e24-8a26-1f48f8e54ebb', display: 'Summary' }] },
            subject: { reference: patientRef },
            encounter: { reference: encounterRef },
            effectiveDateTime,
            valueString: reportData.summary,
          },
        },
        {
          fullUrl: 'urn:uuid:obs-impression',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: { coding: [{ code: 'd51e7bc5-5e07-11ef-8f7c-0242ac120002', display: 'Impression' }] },
            subject: { reference: patientRef },
            encounter: { reference: encounterRef },
            effectiveDateTime,
            valueString: reportData.impression,
          },
        },
        {
          fullUrl: 'urn:uuid:obs-radiology-notes',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: { coding: [{ code: 'ae6e5490-ade9-486e-8268-9e4efd45b07e', display: 'Radiology Notes' }] },
            subject: { reference: patientRef },
            encounter: { reference: encounterRef },
            effectiveDateTime,
            valueString: reportData.radiologyNotes,
          },
        },
        {
          fullUrl: 'urn:uuid:obs-ejection-fraction',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: { coding: [{ code: '159571AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'Ejection Fraction' }] },
            subject: { reference: patientRef },
            encounter: { reference: encounterRef },
            effectiveDateTime,
            valueQuantity: {
              value: reportData.ejectionFraction.value,
              unit: reportData.ejectionFraction.unit,
              system: 'http://unitsofmeasure.org',
              code: reportData.ejectionFraction.unit,
            },
            interpretation: abnormalInterpretation,
          },
        },
        {
          fullUrl: 'urn:uuid:obs-echo-comment',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: { coding: [{ code: '159573AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'Echocardiogram comment' }] },
            subject: { reference: patientRef },
            encounter: { reference: encounterRef },
            effectiveDateTime,
            valueString: reportData.echocardiogramComment,
          },
        },
        {
          fullUrl: 'urn:uuid:obs-lv-systolic',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: {
              coding: [{ code: '167023AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'Left ventricular systolic function' }],
            },
            subject: { reference: patientRef },
            encounter: { reference: encounterRef },
            effectiveDateTime,
            valueCodeableConcept: {
              coding: [
                { code: '159568AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: reportData.leftVentricularSystolicFunction },
              ],
            },
          },
        },
        {
          fullUrl: 'urn:uuid:obs-lv-volume',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: {
              coding: [
                {
                  code: '166952AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                  display: 'Left ventricular volume estimated from ultrasound (qualitative)',
                },
              ],
            },
            subject: { reference: patientRef },
            encounter: { reference: encounterRef },
            effectiveDateTime,
            valueCodeableConcept: {
              coding: [{ code: '1115AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: reportData.leftVentricularVolume }],
            },
          },
        },
        {
          fullUrl: 'urn:uuid:obs-heart-great-vessels',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: {
              coding: [
                { code: '160944AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'Heart and great vessels examination (text)' },
              ],
            },
            subject: { reference: patientRef },
            encounter: { reference: encounterRef },
            effectiveDateTime,
            valueString: reportData.heartAndGreatVessels,
            interpretation: abnormalInterpretation,
          },
        },
        {
          fullUrl: 'urn:uuid:obs-pericardial',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: { coding: [{ code: '166946AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'No pericardial effusion' }] },
            subject: { reference: patientRef },
            encounter: { reference: encounterRef },
            effectiveDateTime,
            valueString: reportData.noPericardialEffusion,
          },
        },
        {
          fullUrl: 'urn:uuid:obs-radiology-results',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: { coding: [{ code: '1392AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'Radiology results' }] },
            subject: { reference: patientRef },
            encounter: { reference: encounterRef },
            effectiveDateTime,
            valueString: reportData.radiologyResults,
          },
        },
        {
          fullUrl: 'urn:uuid:obs-cardiac-exam',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: { coding: [{ code: '163046AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'Cardiac examination (text)' }] },
            subject: { reference: patientRef },
            encounter: { reference: encounterRef },
            effectiveDateTime,
            valueString: reportData.cardiacExamination,
          },
        },
        {
          fullUrl: 'urn:uuid:obs-improvement',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: {
              coding: [{ code: '5455efa4-e42d-46d8-9146-bf2dd5a65f1e', display: 'Improvement seen on echocardiogram' }],
            },
            subject: { reference: patientRef },
            encounter: { reference: encounterRef },
            effectiveDateTime,
            valueCodeableConcept: {
              coding: [{ code: '1065AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: reportData.improvementSeen }],
            },
          },
        },
        {
          fullUrl: 'urn:uuid:obs-ventricular-size',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: {
              coding: [
                {
                  code: '164326AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                  display: 'Combined right and left lateral ventricular size (mm)',
                },
              ],
            },
            subject: { reference: patientRef },
            encounter: { reference: encounterRef },
            effectiveDateTime,
            valueQuantity: {
              value: reportData.combinedVentricularSize.value,
              unit: reportData.combinedVentricularSize.unit,
              system: 'http://unitsofmeasure.org',
              code: reportData.combinedVentricularSize.unit,
            },
          },
        },
        {
          fullUrl: 'urn:uuid:obs-cardiac-enlargement',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: {
              coding: [{ code: '5158AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'Evidence of cardiac enlargement' }],
            },
            subject: { reference: patientRef },
            encounter: { reference: encounterRef },
            effectiveDateTime,
            valueString: reportData.evidenceOfCardiacEnlargement,
          },
        },
        {
          fullUrl: 'urn:uuid:obs-abnormal-sounds',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: { coding: [{ code: '1117AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'Abnormal heart sounds' }] },
            subject: { reference: patientRef },
            encounter: { reference: encounterRef },
            effectiveDateTime,
            valueString: reportData.abnormalHeartSounds,
            interpretation: abnormalInterpretation,
          },
        },
      ],
    };
  }

  private buildAtypicalLymphBundle(
    patientUuid: string,
    encounterUuid: string,
    serviceRequestUuid: string,
    reportData: AtypicalLymphReportData
  ) {
    const effectiveDateTime = `${reportData.effectiveDate}T10:00:00Z`;
    const patientRef = `Patient/${patientUuid}`;
    const conceptCode = '1334AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const conceptDisplay = 'Absolute atypical lymphocyte count';

    return {
      resourceType: 'Bundle',
      type: 'collection',
      entry: [
        {
          fullUrl: 'urn:uuid:dr-atypical-lymph',
          resource: {
            resourceType: 'DiagnosticReport',
            basedOn: [{ reference: `ServiceRequest/${serviceRequestUuid}` }],
            status: 'final',
            category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0074', code: 'LAB' }] }],
            code: { coding: [{ code: conceptCode, display: conceptDisplay }] },
            subject: { reference: patientRef },
            encounter: { reference: `Encounter/${encounterUuid}` },
            effectiveDateTime: reportData.effectiveDate,
            result: [{ reference: 'urn:uuid:obs-atypical-lymph' }],
          },
        },
        {
          fullUrl: 'urn:uuid:obs-atypical-lymph',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: { coding: [{ code: conceptCode, display: conceptDisplay }] },
            subject: { reference: patientRef },
            effectiveDateTime,
            valueQuantity: {
              value: reportData.atypicalLymphCount.value,
              unit: reportData.atypicalLymphCount.unit,
              system: 'http://unitsofmeasure.org',
              code: reportData.atypicalLymphCount.unit,
            },
            referenceRange: [
              {
                low: { value: 1, unit: '10^3/uL', system: 'http://unitsofmeasure.org', code: '10^3/uL' },
                high: { value: 50, unit: '10^3/uL', system: 'http://unitsofmeasure.org', code: '10^3/uL' },
                type: {
                  coding: [
                    {
                      system: 'http://terminology.hl7.org/CodeSystem/referencerange-meaning',
                      code: 'normal',
                      display: 'Normal Range',
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    };
  }

  private buildAnemiaBundle(
    patientUuid: string,
    encounterUuid: string,
    serviceRequestUuid: string,
    reportData: AnemiaReportData
  ) {
    const effectiveDateTime = `${reportData.effectiveDate}T10:00:00Z`;
    const patientRef = `Patient/${patientUuid}`;

    return {
      resourceType: 'Bundle',
      type: 'collection',
      entry: [
        {
          fullUrl: 'urn:uuid:dr-anemia',
          resource: {
            resourceType: 'DiagnosticReport',
            id: 'dr-anemia',
            basedOn: [{ reference: `ServiceRequest/${serviceRequestUuid}` }],
            status: 'final',
            category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0074', code: 'LAB' }] }],
            code: {
              coding: [{ code: '161437AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'Anemia panel' }],
            },
            subject: { reference: patientRef },
            encounter: { reference: `Encounter/${encounterUuid}` },
            effectiveDateTime: reportData.effectiveDate,
            result: [
              { reference: 'urn:uuid:obs-hgb' },
              { reference: 'urn:uuid:obs-hct' },
              { reference: 'urn:uuid:obs-smear' },
              { reference: 'urn:uuid:obs-sickle' },
              { reference: 'urn:uuid:obs-retic' },
              { reference: 'urn:uuid:obs-electro' },
              { reference: 'urn:uuid:obs-plt' },
            ],
          },
        },
        {
          fullUrl: 'urn:uuid:obs-hgb',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: { coding: [{ code: '21AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'Haemoglobin' }] },
            subject: { reference: patientRef },
            effectiveDateTime,
            valueQuantity: {
              value: reportData.haemoglobin.value,
              unit: reportData.haemoglobin.unit,
              system: 'http://unitsofmeasure.org',
              code: reportData.haemoglobin.unit,
            },
            interpretation: [
              {
                coding: [
                  {
                    system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                    code: 'A',
                    display: 'Abnormal',
                  },
                ],
              },
            ],
            referenceRange: [
              {
                low: { value: 10.4, unit: 'g/dL', system: 'http://unitsofmeasure.org', code: 'g/dL' },
                high: { value: 17.8, unit: 'g/dL', system: 'http://unitsofmeasure.org', code: 'g/dL' },
                type: {
                  coding: [
                    {
                      system: 'http://terminology.hl7.org/CodeSystem/referencerange-meaning',
                      code: 'normal',
                      display: 'Normal Range',
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          fullUrl: 'urn:uuid:obs-hct',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: {
              coding: [{ code: '1015AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'Hematocrit' }],
            },
            subject: { reference: patientRef },
            effectiveDateTime,
            valueQuantity: {
              value: reportData.hematocrit.value,
              unit: reportData.hematocrit.unit,
              system: 'http://unitsofmeasure.org',
              code: reportData.hematocrit.unit,
            },
            interpretation: [
              {
                coding: [
                  {
                    system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                    code: 'A',
                    display: 'Abnormal',
                  },
                ],
              },
            ],
            referenceRange: [
              {
                low: { value: 32.3, unit: '%', system: 'http://unitsofmeasure.org', code: '%' },
                high: { value: 51.9, unit: '%', system: 'http://unitsofmeasure.org', code: '%' },
                type: {
                  coding: [
                    {
                      system: 'http://terminology.hl7.org/CodeSystem/referencerange-meaning',
                      code: 'normal',
                      display: 'Normal Range',
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          fullUrl: 'urn:uuid:obs-smear',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: {
              coding: [
                {
                  code: '161423AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                  display: 'Peripheral smear for RBC morphology',
                },
              ],
            },
            subject: { reference: patientRef },
            effectiveDateTime,
            valueString: reportData.peripheralSmear,
          },
        },
        {
          fullUrl: 'urn:uuid:obs-sickle',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: {
              coding: [
                {
                  code: '160225AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                  display: 'Sickle cell screening test',
                },
              ],
            },
            subject: { reference: patientRef },
            effectiveDateTime,
            valueCodeableConcept: {
              coding: [{ code: '703AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: reportData.sickleCellTest }],
            },
            interpretation: [
              {
                coding: [
                  {
                    system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                    code: 'A',
                    display: 'Abnormal',
                  },
                ],
              },
            ],
          },
        },
        {
          fullUrl: 'urn:uuid:obs-retic',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: {
              coding: [{ code: '1327AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'Reticulocytes (%)' }],
            },
            subject: { reference: patientRef },
            effectiveDateTime,
            valueQuantity: {
              value: reportData.reticulocytes.value,
              unit: reportData.reticulocytes.unit,
              system: 'http://unitsofmeasure.org',
              code: reportData.reticulocytes.unit,
            },
          },
        },
        {
          fullUrl: 'urn:uuid:obs-electro',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: {
              coding: [{ code: '161421AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'Hemoglobin electrophoresis' }],
            },
            subject: { reference: patientRef },
            effectiveDateTime,
            valueString: reportData.hemoglobinElectrophoresis,
          },
        },
        {
          fullUrl: 'urn:uuid:obs-plt',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            code: {
              coding: [{ code: '729AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'Platelets' }],
            },
            subject: { reference: patientRef },
            effectiveDateTime,
            valueQuantity: {
              value: reportData.platelets.value,
              unit: reportData.platelets.unit,
              system: 'http://unitsofmeasure.org',
              code: reportData.platelets.unit,
            },
            interpretation: [
              {
                coding: [
                  {
                    system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                    code: 'A',
                    display: 'Abnormal',
                  },
                ],
              },
            ],
            referenceRange: [
              {
                low: { value: 134, unit: '10^3/mL', system: 'http://unitsofmeasure.org', code: '10^3/mL' },
                high: { value: 419, unit: '10^3/mL', system: 'http://unitsofmeasure.org', code: '10^3/mL' },
                type: {
                  coding: [
                    {
                      system: 'http://terminology.hl7.org/CodeSystem/referencerange-meaning',
                      code: 'normal',
                      display: 'Normal Range',
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    };
  }

  private getAuthHeaders() {
    const { username, password } = config.users.admin;
    const encoded = Buffer.from(`${username}:${password}`).toString('base64');
    return { Authorization: `Basic ${encoded}` };
  }
}
