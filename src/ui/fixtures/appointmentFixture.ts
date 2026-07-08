import { test as base, expect, request } from '@playwright/test';
import { PageFactory } from '../pages/PageFactory';
import { ActionFactory } from '../actions/ActionFactory';
import { AppointmentApiHelper } from '../../utils/appointment-api-helper';
import { ApiFactory } from '../../api/ApiFactory';
import { config } from '../../config/env.config';
import {
  generateUpcomingAppointmentDates,
  generatePastAppointmentDates,
} from '../../../test-data/common/appointmentData';
import { setupConsultationContext, teardownConsultationContext } from '../../api/helpers/consultationSetup';

type AppointmentFixtures = {
  appointmentSetup: {
    bahmni: PageFactory;
    actions: ActionFactory;
    page: import('@playwright/test').Page;
  };
};

export const test = base.extend<AppointmentFixtures>({
  appointmentSetup: async ({ browser }, use) => {
    const apiContext = await request.newContext({ ignoreHTTPSErrors: true });
    const api = new ApiFactory(apiContext);

    const consultationCtx = await setupConsultationContext(api);
    const { patientUuid } = consultationCtx;
    const locationUuid = consultationCtx.locationUuid;
    if (!locationUuid) throw new Error('locationUuid not set by setupConsultationContext');

    const appointmentApi = new AppointmentApiHelper(apiContext);
    const serviceUuid = await appointmentApi.getFirstAvailableServiceUuid();

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

    const context = await browser.newContext();
    const page = await context.newPage();
    const bahmni = new PageFactory(page);
    const actions = new ActionFactory(bahmni);

    await actions.auth.loginAsAdmin();
    await page.goto(`${config.baseUrl}/bahmni-v2/clinical/${patientUuid}`);
    await page.waitForLoadState('networkidle', { timeout: 20000 });

    await use({ bahmni, actions, page });

    try {
      await teardownConsultationContext(api, consultationCtx);
    } finally {
      await apiContext.dispose();
      await context.close();
    }
  },
});

export { expect };
