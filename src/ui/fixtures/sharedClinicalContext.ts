// Shared bootstrap for all clinical dashboard fixtures — one place to change how a patient is created and the browser lands on /clinical/${uuid}.
import { APIRequestContext, Browser, BrowserContext, Page, request } from '@playwright/test';
import { PageFactory } from '../pages/PageFactory';
import { ActionFactory } from '../actions/ActionFactory';
import { ApiFactory } from '../../api/ApiFactory';
import { generatePatientData, PatientData } from '../../../test-data/common/patientData';
import {
  ConsultationContext,
  setupConsultationContext,
  teardownConsultationContext,
} from '../../api/helpers/consultationSetup';
import { config } from '../../config/env.config';

// 'ui' = register via form (slower, exercises UI flow); 'api' = create via REST (faster, when the test doesn't care how the patient got there).
export type PatientSetupMode = 'ui' | 'api';

// patientData is set only in UI mode; consultationCtx is set only in API mode — narrow via ctx.mode before dereferencing.
export interface SharedClinicalContext {
  context: BrowserContext;
  page: Page;
  bahmni: PageFactory;
  actions: ActionFactory;
  api: ApiFactory;
  apiContext: APIRequestContext;
  patientUuid: string;
  patientId: string;
  patientData?: PatientData;
  consultationCtx?: ConsultationContext;
  mode: PatientSetupMode;
}

// Passed to onPatientReady — everything a hook needs to seed patient-scoped data (appointments, docs, etc.).
export interface PatientReadyContext {
  api: ApiFactory;
  apiContext: APIRequestContext;
  patientUuid: string;
  consultationCtx?: ConsultationContext;
}

// onPatientReady fires between patient creation and dashboard navigation — use it so seeded data is present on first render (no page.reload needed).
export async function createSharedClinicalContext(
  browser: Browser,
  mode: PatientSetupMode,
  onPatientReady?: (ctx: PatientReadyContext) => Promise<void>
): Promise<SharedClinicalContext> {
  const apiContext = await request.newContext({ ignoreHTTPSErrors: true });
  const api = new ApiFactory(apiContext);

  const browserContext = await browser.newContext();
  const page = await browserContext.newPage();
  const bahmni = new PageFactory(page);
  const actions = new ActionFactory(bahmni);

  await actions.auth.loginAsAdmin();

  if (mode === 'ui') {
    const patientData = generatePatientData();
    const patientId = await actions.registration.registerPatientWithMandatoryDetails(patientData);
    await bahmni.createPatientPage.saveAndStartOPDVisit();
    await bahmni.createPatientPage.navigateToDashboard();

    const { body: searchBody } = await api.patient.search(patientId);
    const patientUuid = searchBody.entry?.[0]?.resource.id;
    if (!patientUuid) {
      throw new Error(`Patient not found by ID "${patientId}" — cannot proceed with clinical setup`);
    }

    if (onPatientReady) {
      await onPatientReady({ api, apiContext, patientUuid });
    }

    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // UI mode: patientData is set (form input); patientId is the OpenMRS display identifier; consultationCtx is undefined.
    return {
      context: browserContext,
      page,
      bahmni,
      actions,
      api,
      apiContext,
      patientUuid,
      patientId,
      patientData,
      mode,
    };
  }

  const consultationCtx = await setupConsultationContext(api);
  const { patientUuid } = consultationCtx;

  if (onPatientReady) {
    await onPatientReady({ api, apiContext, patientUuid, consultationCtx });
  }

  await page.goto(`${config.baseUrl}/bahmni-v2/clinical/${patientUuid}`);
  await page.waitForLoadState('networkidle', { timeout: 20000 });

  // API mode: consultationCtx is set (visit/encounter/practitioner UUIDs); patientId aliases patientUuid; patientData is undefined.
  return {
    context: browserContext,
    page,
    bahmni,
    actions,
    api,
    apiContext,
    patientUuid,
    patientId: patientUuid,
    consultationCtx,
    mode,
  };
}

// Idempotent re-nav for worker-scoped fixtures — a previous test may have left the page mid-consultation.
export async function ensureOnClinicalDashboard(ctx: SharedClinicalContext): Promise<void> {
  const currentUrl = ctx.page.url();
  const onClinicalDashboard = currentUrl.includes('/clinical/') && !currentUrl.includes('/consultation');
  if (!onClinicalDashboard) {
    await ctx.page.goto(`${config.baseUrl}/bahmni-v2/clinical/${ctx.patientUuid}`);
    await ctx.page.waitForLoadState('networkidle', { timeout: 10000 });
  }
}

// Ends the visit (API mode) and deletes the patient, then releases apiContext and browser context.
export async function disposeSharedClinicalContext(ctx: SharedClinicalContext): Promise<void> {
  try {
    if (ctx.mode === 'ui') {
      await ctx.api.patient.delete(ctx.patientUuid);
    } else if (ctx.consultationCtx) {
      await teardownConsultationContext(ctx.api, ctx.consultationCtx);
    }
  } finally {
    await ctx.apiContext.dispose();
    await ctx.context.close();
  }
}
