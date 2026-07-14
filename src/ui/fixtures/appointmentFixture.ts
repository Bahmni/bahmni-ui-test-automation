// Test-scoped fixture: API patient + 4 seeded appointments (2 upcoming, 2 past), created before dashboard nav so the widget sees them on first render.
import { test as base, Page } from '@playwright/test';
import { PageFactory } from '../pages/PageFactory';
import { ActionFactory } from '../actions/ActionFactory';
import { AppointmentApiHelper } from '../../utils/appointment-api-helper';
import {
  generateUpcomingAppointmentDates,
  generatePastAppointmentDates,
} from '../../../test-data/common/appointmentData';
import { createSharedClinicalContext, disposeSharedClinicalContext } from './sharedClinicalContext';

type AppointmentFixtures = {
  appointmentSetup: {
    bahmni: PageFactory;
    actions: ActionFactory;
    page: Page;
  };
};

export const test = base.extend<AppointmentFixtures>({
  appointmentSetup: async ({ browser }, use) => {
    const ctx = await createSharedClinicalContext(
      browser,
      'api',
      async ({ apiContext, patientUuid, consultationCtx }) => {
        const locationUuid = consultationCtx?.locationUuid;
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
      }
    );

    await use({ bahmni: ctx.bahmni, actions: ctx.actions, page: ctx.page });

    await disposeSharedClinicalContext(ctx);
  },
});

export { expect } from './expectExtensions';
