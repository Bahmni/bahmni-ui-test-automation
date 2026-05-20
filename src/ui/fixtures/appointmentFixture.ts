import { test as base, expect } from '@playwright/test';
import { PageFactory } from '../pages/PageFactory';
import { ActionFactory } from '../actions/ActionFactory';
import { generatePatientData, PatientData } from '../../../test-data/common/patientData';
import { AppointmentApiHelper } from '../../utils/appointment-api-helper';
import { ApiFactory } from '../../api/ApiFactory';
import { config } from '../../config/env.config';
import {
  generateUpcomingAppointmentDates,
  generatePastAppointmentDates,
} from '../../../test-data/common/appointmentData';

type AppointmentFixtures = {
  appointmentSetup: {
    bahmni: PageFactory;
    actions: ActionFactory;
    patientData: PatientData;
    patientId: string;
    page: import('@playwright/test').Page;
  };
};

export const test = base.extend<AppointmentFixtures>({
  appointmentSetup: async ({ browser, playwright }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const bahmni = new PageFactory(page);
    const actions = new ActionFactory(bahmni);
    const patientData = generatePatientData();

    await actions.auth.loginAsAdmin();
    const patientId = await actions.registration.registerPatientWithMandatoryDetails(patientData);
    await bahmni.createPatientPage.saveAndStartOPDVisit();
    await page.waitForLoadState('networkidle');

    const apiContext = await playwright.request.newContext();
    const appointmentApi = new AppointmentApiHelper(apiContext);
    const serviceUuid = await appointmentApi.getFirstAvailableServiceUuid();
    const locationUuid = await appointmentApi.getLocationUuid(config.defaults.location);

    const patientUuid = await getPatientUuid(apiContext, patientId);

    await appointmentApi.createAppointment({
      patientUuid,
      serviceUuid,
      dates: generateUpcomingAppointmentDates(2, 10),
      status: 'Scheduled',
      locationUuid,
    });

    await appointmentApi.createAppointment({
      patientUuid,
      serviceUuid,
      dates: generateUpcomingAppointmentDates(5, 14),
      status: 'Scheduled',
      locationUuid,
    });

    await appointmentApi.createAppointment({
      patientUuid,
      serviceUuid,
      dates: generatePastAppointmentDates(3, 10),
      status: 'Completed',
      locationUuid,
    });

    await appointmentApi.createAppointment({
      patientUuid,
      serviceUuid,
      dates: generatePastAppointmentDates(7, 14),
      status: 'Completed',
      locationUuid,
    });

    await actions.clinical.navigateToPatientClinical(patientId);
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    await use({ bahmni, actions, patientData, patientId, page });

    // Teardown: void patient (cascades to visits/appointments). Use try/finally
    // so apiContext + browser context are released even if delete fails.
    try {
      await new ApiFactory(apiContext).patient.delete(patientUuid);
    } finally {
      await apiContext.dispose();
      await context.close();
    }
  },
});

async function getPatientUuid(
  apiContext: import('@playwright/test').APIRequestContext,
  patientId: string
): Promise<string> {
  const { config } = await import('../../config/env.config');
  const { username, password } = config.users.admin;
  const encoded = Buffer.from(`${username}:${password}`).toString('base64');

  const response = await apiContext.get(`${config.baseUrl}/openmrs/ws/rest/v1/patient?q=${patientId}&v=default`, {
    headers: { Authorization: `Basic ${encoded}` },
  });
  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`Patient not found with ID: ${patientId}`);
  }
  return data.results[0].uuid;
}

export { expect };
