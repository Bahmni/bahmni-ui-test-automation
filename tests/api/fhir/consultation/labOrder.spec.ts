import { test, expect } from '../../../../src/api/fixtures/apiFixture';
import { getBundleEntriesByType } from '../../../../src/utils/fhir-bundle-utils';
import {
  buildSingleLabOrderBundle,
  buildPanelLabOrderBundle,
  buildRadiologyOrderBundle,
  buildProcedureOrderBundle,
  buildRadiologyNewEncounterBundle,
} from '../../../../test-data/api/consultationBundlePayload';
import {
  buildAbsoluteImmatureCellCountDRBundle,
  buildCompleteBloodCountDRBundle,
  buildSickleCellDRBundle,
  buildAnemiaPanelDRBundle,
  buildPeripheralSmearDRBundle,
  buildHemoglobinElectrophoresisDRBundle,
  buildHivTestDRBundle,
} from '../../../../test-data/api/diagnosticReportPayload';
import {
  LAB_CONCEPTS,
  RADIOLOGY_CONCEPTS,
  PROCEDURE_CONCEPTS,
  SERVICE_REQUEST_CATEGORIES,
} from '../../../../test-data/api/constants';
import { SMALL_PNG_BASE64, SMALL_PDF_BASE64 } from '../../../../test-data/api/testAttachments';
import {
  ConsultationContext,
  extractFirstUuidFromBundle,
  setupConsultationContext,
  startNewVisit,
  teardownConsultationContext,
} from '../../../../src/api/helpers/consultationSetup';
import {
  ServiceRequestEntry,
  DiagnosticReportEntry,
  ObservationEntry,
} from '../../../../src/api/types/fhir-resources.types';
import { FhirApiHelper } from '../../../../src/utils/fhir-api-helper';
import { echocardiogramReportData, xRayArmReportData } from '../../../../test-data/common/labOrderData';

test.describe.serial('POST /fhir2/R4/ConsultationBundle → GET /fhir2/R4/ServiceRequest', () => {
  let ctx: ConsultationContext;
  let encounterUuid: string;

  test.beforeAll(async ({ api }) => {
    ctx = await setupConsultationContext(api);
  });

  test('POST single lab test — order is saved and GET returns expected fields', async ({ api }) => {
    const { body } = await api.fhir.submitConsultationBundle(buildSingleLabOrderBundle(ctx));
    encounterUuid = extractFirstUuidFromBundle(body, 'Encounter');

    const { body: getBody } = await api.fhir.getLabServiceRequests(ctx.patientUuid);
    const orders = getBundleEntriesByType<ServiceRequestEntry>(getBody, 'ServiceRequest');
    const order = orders.find((o) => o.code.coding[0].code === LAB_CONCEPTS.absoluteImmatureCellCount);

    expect(order).toBeDefined();
    expect(order?.status).toBe('active');
    expect(order?.category?.[0].coding[0].code).toBe(SERVICE_REQUEST_CATEGORIES.lab);
    expect(order?.code.coding[0].display).toBeDefined();
    expect(order?.requester?.reference).toContain(ctx.practitionerUuid);
    expect(order?.occurrencePeriod?.start).toBeDefined();
    expect(order?.note?.[0].text).toBeDefined();
    expect(order?.extension?.[0].valueString).toBe('Test');
  });

  test('POST panel lab test — order is saved, GET returns expected fields and reuses same encounter', async ({
    api,
  }) => {
    await api.fhir.submitConsultationBundle(buildPanelLabOrderBundle(ctx, encounterUuid));

    const { body: getBody } = await api.fhir.getLabServiceRequests(ctx.patientUuid);
    const orders = getBundleEntriesByType<ServiceRequestEntry>(getBody, 'ServiceRequest');
    const order = orders.find((o) => o.code.coding[0].code === LAB_CONCEPTS.completeBloodCount);

    expect(order).toBeDefined();
    expect(order?.status).toBe('active');
    expect(order?.category?.[0].coding[0].code).toBe(SERVICE_REQUEST_CATEGORIES.lab);
    expect(order?.code.coding[0].display).toBeDefined();
    expect(order?.requester?.reference).toContain(ctx.practitionerUuid);
    expect(order?.occurrencePeriod?.start).toBeDefined();
    expect(order?.note?.[0].text).toBeDefined();
    expect(order?.extension?.[0].valueString).toBe('Panel');
    expect(order?.encounter.reference).toContain(encounterUuid);
  });

  test('POST radiology order — order is saved, GET returns expected fields and reuses same encounter', async ({
    api,
  }) => {
    await api.fhir.submitConsultationBundle(buildRadiologyOrderBundle(ctx, encounterUuid));

    const { body: getBody } = await api.fhir.getRadiologyServiceRequests(ctx.patientUuid);
    const orders = getBundleEntriesByType<ServiceRequestEntry>(getBody, 'ServiceRequest');
    const order = orders.find((o) => o.code.coding[0].code === RADIOLOGY_CONCEPTS.echocardiogram);

    expect(order).toBeDefined();
    expect(order?.status).toBe('active');
    expect(order?.category?.[0].coding[0].code).toBe(SERVICE_REQUEST_CATEGORIES.radiology);
    expect(order?.code.coding[0].display).toBeDefined();
    expect(order?.requester?.reference).toContain(ctx.practitionerUuid);
    expect(order?.occurrencePeriod?.start).toBeDefined();
    expect(order?.note?.[0].text).toBeDefined();
    expect(order?.encounter.reference).toContain(encounterUuid);
  });

  test(
    'POST procedure order — order is saved, GET returns expected fields and reuses same encounter',
    { tag: '@onlyStandard' },
    async ({ api }) => {
      await api.fhir.submitConsultationBundle(buildProcedureOrderBundle(ctx, encounterUuid));

      const { body: getBody } = await api.fhir.getProcedureServiceRequests(ctx.patientUuid);
      const orders = getBundleEntriesByType<ServiceRequestEntry>(getBody, 'ServiceRequest');
      const order = orders.find((o) => o.code.coding[0].code === PROCEDURE_CONCEPTS.reconstructionProcedure);

      expect(order).toBeDefined();
      expect(order?.status).toBe('active');
      expect(order?.category?.[0].coding[0].code).toBe(SERVICE_REQUEST_CATEGORIES.procedure);
      expect(order?.code.coding[0].display).toBeDefined();
      expect(order?.requester?.reference).toContain(ctx.practitionerUuid);
      expect(order?.occurrencePeriod?.start).toBeDefined();
      expect(order?.note?.[0].text).toBeDefined();
      expect(order?.encounter.reference).toContain(encounterUuid);
    }
  );

  test.afterAll(async ({ api }) => {
    await teardownConsultationContext(api, ctx);
  });
});

test.describe.serial('GET /fhir2/R4/ServiceRequest — numberOfVisits limits orders to N most recent visits', () => {
  let ctx: ConsultationContext;

  test.beforeAll(async ({ api }) => {
    ctx = await setupConsultationContext(api);

    await api.fhir.submitConsultationBundle(buildSingleLabOrderBundle(ctx, LAB_CONCEPTS.absoluteImmatureCellCount));
    await api.fhir.submitConsultationBundle(buildRadiologyNewEncounterBundle(ctx, RADIOLOGY_CONCEPTS.echocardiogram));

    await api.visit.endVisit(ctx.visitUuid);

    const { visitUuid, visitEncounterUuid } = await startNewVisit(api, ctx);
    ctx.visitUuid = visitUuid;
    ctx.visitEncounterUuid = visitEncounterUuid;

    await api.fhir.submitConsultationBundle(buildSingleLabOrderBundle(ctx, LAB_CONCEPTS.completeBloodCount));
    await api.fhir.submitConsultationBundle(
      buildRadiologyNewEncounterBundle(ctx, RADIOLOGY_CONCEPTS.xRaySkullFourViews)
    );
  });

  test('GET lab orders with numberOfVisits=1 — returns only orders from the most recent visit', async ({ api }) => {
    const { body } = await api.fhir.getLabServiceRequests(ctx.patientUuid, 200, undefined, 1);
    const codes = getBundleEntriesByType<ServiceRequestEntry>(body, 'ServiceRequest').map((o) => o.code.coding[0].code);

    expect(codes).toContain(LAB_CONCEPTS.completeBloodCount);
    expect(codes).not.toContain(LAB_CONCEPTS.absoluteImmatureCellCount);
  });

  test('GET lab orders with numberOfVisits=2 — returns orders from both visits', async ({ api }) => {
    const { body } = await api.fhir.getLabServiceRequests(ctx.patientUuid, 200, undefined, 2);
    const codes = getBundleEntriesByType<ServiceRequestEntry>(body, 'ServiceRequest').map((o) => o.code.coding[0].code);

    expect(codes).toContain(LAB_CONCEPTS.completeBloodCount);
    expect(codes).toContain(LAB_CONCEPTS.absoluteImmatureCellCount);
  });

  test('GET radiology orders with numberOfVisits=1 — returns only orders from the most recent visit', async ({
    api,
  }) => {
    const { body } = await api.fhir.getRadiologyServiceRequests(ctx.patientUuid, 200, undefined, 1);
    const codes = getBundleEntriesByType<ServiceRequestEntry>(body, 'ServiceRequest').map((o) => o.code.coding[0].code);

    expect(codes).toContain(RADIOLOGY_CONCEPTS.xRaySkullFourViews);
    expect(codes).not.toContain(RADIOLOGY_CONCEPTS.echocardiogram);
  });

  test('GET radiology orders with numberOfVisits=2 — returns orders from both visits', async ({ api }) => {
    const { body } = await api.fhir.getRadiologyServiceRequests(ctx.patientUuid, 200, undefined, 2);
    const codes = getBundleEntriesByType<ServiceRequestEntry>(body, 'ServiceRequest').map((o) => o.code.coding[0].code);

    expect(codes).toContain(RADIOLOGY_CONCEPTS.xRaySkullFourViews);
    expect(codes).toContain(RADIOLOGY_CONCEPTS.echocardiogram);
  });

  test.afterAll(async ({ api }) => {
    await teardownConsultationContext(api, ctx);
  });
});

test.describe.serial('POST DiagnosticReport/$submit-bundle → GET $fetch-bundle', () => {
  let ctx: ConsultationContext;
  let srIds = {} as Record<string, string>;
  let encIds = {} as Record<string, string>;
  let drIds = {} as Record<string, string>;
  let pngUrl: string;
  let pdfUrl: string;

  test.beforeAll(async ({ api }) => {
    ctx = await setupConsultationContext(api);

    const submitOrder = async (code: string) => {
      const { body } = await api.fhir.submitConsultationBundle(buildSingleLabOrderBundle(ctx, code));
      return {
        enc: extractFirstUuidFromBundle(body, 'Encounter'),
        sr: extractFirstUuidFromBundle(body, 'ServiceRequest'),
      };
    };

    const r1 = await submitOrder(LAB_CONCEPTS.absoluteImmatureCellCount);
    encIds.immCell = r1.enc;
    srIds.immCell = r1.sr;

    const r2 = await submitOrder(LAB_CONCEPTS.completeBloodCount);
    encIds.cbc = r2.enc;
    srIds.cbc = r2.sr;

    const r3 = await submitOrder(LAB_CONCEPTS.sickleCell);
    encIds.sickleCell = r3.enc;
    srIds.sickleCell = r3.sr;

    const r4 = await submitOrder(LAB_CONCEPTS.anemiaPanel);
    encIds.anemia = r4.enc;
    srIds.anemia = r4.sr;

    const r5 = await submitOrder(LAB_CONCEPTS.peripheralSmear);
    encIds.smear = r5.enc;
    srIds.smear = r5.sr;

    const r6 = await submitOrder(LAB_CONCEPTS.hemoglobinElectrophoresis);
    encIds.electro = r6.enc;
    srIds.electro = r6.sr;

    const r7 = await submitOrder(LAB_CONCEPTS.hivTest);
    encIds.hiv = r7.enc;
    srIds.hiv = r7.sr;

    const { body: pngBody } = await api.fhir.uploadDocument(
      ctx.patientUuid,
      SMALL_PNG_BASE64,
      'testImage',
      'image',
      'png'
    );
    pngUrl = pngBody.url;
    const { body: pdfBody } = await api.fhir.uploadDocument(
      ctx.patientUuid,
      SMALL_PDF_BASE64,
      'testReport',
      'pdf',
      'pdf'
    );
    pdfUrl = pdfBody.url;

    await api.fhir.submitDiagnosticReport(
      buildAbsoluteImmatureCellCountDRBundle(ctx.patientUuid, encIds.immCell, srIds.immCell)
    );
    await api.fhir.submitDiagnosticReport(buildCompleteBloodCountDRBundle(ctx.patientUuid, encIds.cbc, srIds.cbc));
    await api.fhir.submitDiagnosticReport(
      buildSickleCellDRBundle(ctx.patientUuid, encIds.sickleCell, srIds.sickleCell, {
        contentType: 'image/png',
        url: pngUrl,
        title: 'result.png',
      })
    );
    await api.fhir.submitDiagnosticReport(
      buildAnemiaPanelDRBundle(ctx.patientUuid, encIds.anemia, srIds.anemia, [
        { contentType: 'image/png', url: pngUrl, title: 'result1.png' },
        { contentType: 'image/png', url: pngUrl, title: 'result2.png' },
        { contentType: 'application/pdf', url: pdfUrl, title: 'report.pdf' },
      ])
    );
    await api.fhir.submitDiagnosticReport(
      buildPeripheralSmearDRBundle(ctx.patientUuid, encIds.smear, srIds.smear, {
        contentType: 'image/png',
        url: pngUrl,
        title: 'smear.png',
      })
    );
    await api.fhir.submitDiagnosticReport(
      buildHemoglobinElectrophoresisDRBundle(ctx.patientUuid, encIds.electro, srIds.electro)
    );
    await api.fhir.submitDiagnosticReport(buildHivTestDRBundle(ctx.patientUuid, encIds.hiv, srIds.hiv));

    const { body: drBundleBody } = await api.fhir.getDiagnosticReportsByBasedOn(ctx.patientUuid, Object.values(srIds));
    const reports = getBundleEntriesByType<DiagnosticReportEntry>(drBundleBody, 'DiagnosticReport');
    for (const key of Object.keys(srIds)) {
      const dr = reports.find((r) => r.basedOn[0].reference.includes(srIds[key]));
      if (dr) drIds[key] = dr.id;
    }
  });

  test('single lab test — numeric obs, no attachment', async ({ api }) => {
    const { body } = await api.fhir.getDiagnosticReportBundle(drIds.immCell);
    const reports = getBundleEntriesByType<DiagnosticReportEntry>(body, 'DiagnosticReport');
    const observations = getBundleEntriesByType<ObservationEntry>(body, 'Observation');

    expect(reports[0].status).toBe('final');
    expect(reports[0].result?.length).toBe(1);
    expect(reports[0].presentedForm).toBeUndefined();
    expect(observations[0].valueQuantity?.value).toBe(8);
  });

  test('panel lab test — numeric obs × 6, no attachment', async ({ api }) => {
    const { body } = await api.fhir.getDiagnosticReportBundle(drIds.cbc);
    const reports = getBundleEntriesByType<DiagnosticReportEntry>(body, 'DiagnosticReport');
    const observations = getBundleEntriesByType<ObservationEntry>(body, 'Observation');

    expect(reports[0].status).toBe('final');
    expect(reports[0].result?.length).toBe(6);
    expect(reports[0].presentedForm).toBeUndefined();
    const hgb = observations.find((o) => o.code.coding[0].code === '21AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
    const wbc = observations.find((o) => o.code.coding[0].code === '678AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
    expect(hgb?.valueQuantity?.value).toBe(14.5);
    expect(wbc?.valueQuantity?.value).toBe(7.5);
  });

  test('single lab test — coded obs, 1 attachment', async ({ api }) => {
    const { body } = await api.fhir.getDiagnosticReportBundle(drIds.sickleCell);
    const reports = getBundleEntriesByType<DiagnosticReportEntry>(body, 'DiagnosticReport');
    const observations = getBundleEntriesByType<ObservationEntry>(body, 'Observation');

    expect(reports[0].status).toBe('final');
    expect(reports[0].result?.length).toBe(1);
    expect(reports[0].presentedForm?.length).toBe(1);
    expect(observations[0].valueCodeableConcept?.coding[0].code).toBe('703AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  });

  test('panel lab test — mixed obs (numeric + text + coded), 3 attachments', async ({ api }) => {
    const { body } = await api.fhir.getDiagnosticReportBundle(drIds.anemia);
    const reports = getBundleEntriesByType<DiagnosticReportEntry>(body, 'DiagnosticReport');
    const observations = getBundleEntriesByType<ObservationEntry>(body, 'Observation');

    expect(reports[0].status).toBe('final');
    expect(reports[0].result?.length).toBe(7);
    expect(reports[0].presentedForm?.length).toBe(3);
    const hgb = observations.find((o) => o.code.coding[0].code === '21AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
    const smear = observations.find((o) => o.code.coding[0].code === '161423AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
    const sickle = observations.find((o) => o.code.coding[0].code === '160225AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
    expect(hgb?.valueQuantity?.value).toBe(7.2);
    expect(smear?.valueString).toBe('Microcytic hypochromic red cells with anisocytosis and poikilocytosis noted');
    expect(sickle?.valueCodeableConcept?.coding[0].code).toBe('703AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  });

  test('single lab test — no observations, 1 attachment only', async ({ api }) => {
    const { body } = await api.fhir.getDiagnosticReportBundle(drIds.smear);
    const reports = getBundleEntriesByType<DiagnosticReportEntry>(body, 'DiagnosticReport');
    const observations = getBundleEntriesByType(body, 'Observation');

    expect(reports[0].status).toBe('final');
    expect(reports[0].result ?? []).toHaveLength(0);
    expect(reports[0].presentedForm?.length).toBe(1);
    expect(observations.length).toBe(0);
  });

  test('single lab test — text obs, no attachment', async ({ api }) => {
    const { body } = await api.fhir.getDiagnosticReportBundle(drIds.electro);
    const reports = getBundleEntriesByType<DiagnosticReportEntry>(body, 'DiagnosticReport');
    const observations = getBundleEntriesByType<ObservationEntry>(body, 'Observation');

    expect(reports[0].status).toBe('final');
    expect(reports[0].result?.length).toBe(1);
    expect(reports[0].presentedForm).toBeUndefined();
    expect(observations[0].valueString).toBe('HbAA pattern — normal hemoglobin, no sickling variant detected');
  });

  test('single lab test — boolean obs, no attachment', async ({ api }) => {
    const { body } = await api.fhir.getDiagnosticReportBundle(drIds.hiv);
    const reports = getBundleEntriesByType<DiagnosticReportEntry>(body, 'DiagnosticReport');
    const observations = getBundleEntriesByType<ObservationEntry>(body, 'Observation');

    expect(reports[0].status).toBe('final');
    expect(reports[0].result?.length).toBe(1);
    expect(reports[0].presentedForm).toBeUndefined();
    expect(observations[0].valueBoolean).toBe(false);
  });

  test.afterAll(async ({ api }) => {
    await teardownConsultationContext(api, ctx);
  });
});

test.describe.serial('POST DiagnosticReport/$submit-bundle → GET $fetch-bundle (Radiology)', () => {
  let ctx: ConsultationContext;
  let encounterUuid: string;
  let echoServiceRequestUuid: string;
  let xRayServiceRequestUuid: string;
  let echoDrId: string;
  let xRayDrId: string;

  test.beforeAll(async ({ api, request }) => {
    ctx = await setupConsultationContext(api);

    const { body: echoBody } = await api.fhir.submitConsultationBundle(
      buildRadiologyNewEncounterBundle(ctx, RADIOLOGY_CONCEPTS.echocardiogram)
    );
    encounterUuid = extractFirstUuidFromBundle(echoBody, 'Encounter');
    echoServiceRequestUuid = extractFirstUuidFromBundle(echoBody, 'ServiceRequest');

    const { body: xRayBody } = await api.fhir.submitConsultationBundle(
      buildRadiologyNewEncounterBundle(ctx, RADIOLOGY_CONCEPTS.xRayArm)
    );
    xRayServiceRequestUuid = extractFirstUuidFromBundle(xRayBody, 'ServiceRequest');

    const fhirApi = new FhirApiHelper(request);
    await fhirApi.postEchocardiogramReport(
      ctx.patientUuid,
      encounterUuid,
      echoServiceRequestUuid,
      echocardiogramReportData
    );
    await fhirApi.postXRayArmReport(ctx.patientUuid, encounterUuid, xRayServiceRequestUuid, xRayArmReportData);

    const { body: drBundle } = await api.fhir.getDiagnosticReportsByBasedOn(ctx.patientUuid, [
      echoServiceRequestUuid,
      xRayServiceRequestUuid,
    ]);
    const reports = getBundleEntriesByType<DiagnosticReportEntry>(drBundle, 'DiagnosticReport');
    echoDrId = reports.find((r) => r.basedOn[0].reference.includes(echoServiceRequestUuid))?.id ?? '';
    xRayDrId = reports.find((r) => r.basedOn[0].reference.includes(xRayServiceRequestUuid))?.id ?? '';
  });

  test(
    'Echocardiogram — $fetch-bundle returns 15 mixed observations with correct values',
    { tag: '@onlyStandard' },
    async ({ api }) => {
      const { body } = await api.fhir.getDiagnosticReportBundle(echoDrId);
      const reports = getBundleEntriesByType<DiagnosticReportEntry>(body, 'DiagnosticReport');
      const observations = getBundleEntriesByType<ObservationEntry>(body, 'Observation');

      expect(reports[0].status).toBe('final');
      expect(reports[0].result?.length).toBe(15);
      expect(observations.length).toBe(15);

      const ejectionFraction = observations.find(
        (o) => o.code.coding[0].code === '159571AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
      );
      const lvFunction = observations.find((o) => o.code.coding[0].code === '167023AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
      const summary = observations.find((o) => o.code.coding[0].code === 'cf1844e6-d734-4e24-8a26-1f48f8e54ebb');

      expect(ejectionFraction?.valueQuantity?.value).toBe(echocardiogramReportData.ejectionFraction.value);
      expect(lvFunction?.valueCodeableConcept?.coding[0].code).toBe('159568AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
      expect(summary?.valueString).toBe(echocardiogramReportData.summary);
    }
  );

  test(
    'X-ray arm — $fetch-bundle returns 8 observations with text, coded and numeric values',
    { tag: '@onlyStandard' },
    async ({ api }) => {
      const { body } = await api.fhir.getDiagnosticReportBundle(xRayDrId);
      const reports = getBundleEntriesByType<DiagnosticReportEntry>(body, 'DiagnosticReport');
      const observations = getBundleEntriesByType<ObservationEntry>(body, 'Observation');

      expect(reports[0].status).toBe('final');
      expect(reports[0].result?.length).toBe(8);
      expect(observations.length).toBe(8);

      const summary = observations.find((o) => o.code.coding[0].code === 'cf1844e6-d734-4e24-8a26-1f48f8e54ebb');
      const swelling = observations.find((o) => o.code.coding[0].code === '163894AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
      const armLength = observations.find((o) => o.code.coding[0].code === '1ff70b07-1ef6-49fa-9f4b-37cc10900a5a');

      expect(summary?.valueString).toBe(xRayArmReportData.summary);
      expect(swelling?.valueCodeableConcept?.coding[0].code).toBe('1066AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
      expect(armLength?.valueQuantity?.value).toBe(xRayArmReportData.armLengthDiscrepancyCm);
    }
  );

  test.afterAll(async ({ api }) => {
    await teardownConsultationContext(api, ctx);
  });
});
