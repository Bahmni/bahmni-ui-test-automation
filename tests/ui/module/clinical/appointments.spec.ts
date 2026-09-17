import { test, expect } from '../../../../src/ui/fixtures/appointmentFixture';
import { test as clinicalTest } from '../../../../src/ui/fixtures/clinicalFixture';
import { generateUpcomingAppointmentDates } from '../../../../test-data/common/appointmentData';

test.describe('Appointments Display Control', { tag: ['@regression'] }, () => {
  test('Upcoming appointments sorted ASC and past appointments sorted DESC', async ({ appointmentSetup }) => {
    const { bahmni } = appointmentSetup;
    const widget = bahmni.appointmentsDisplayControl;

    await widget.waitForWidgetToLoad();
    await expect(widget.getWidgetCard()).toBeVisible();

    await widget.verifyUpcomingTabIsActive();
    const upcomingAppointments = await widget.getAppointmentRows();
    expect(upcomingAppointments).toHaveLength(2);
    expect(upcomingAppointments[0].status).toContain('Scheduled');
    expect(upcomingAppointments[1].status).toContain('Scheduled');
    const upcomingSlots = upcomingAppointments.map((a) => a.appointmentSlot);
    expect(upcomingSlots[0]).toContain('10:00 AM');
    expect(upcomingSlots[1]).toContain('2:00 PM');

    await widget.clickPastTab();
    const pastAppointments = await widget.getAppointmentRows();
    expect(pastAppointments).toHaveLength(2);
    expect(pastAppointments[0].status).toContain('Completed');
    expect(pastAppointments[1].status).toContain('Completed');
    const pastSlots = pastAppointments.map((a) => a.appointmentSlot);
    expect(pastSlots[0]).toContain('10:00 AM');
    expect(pastSlots[1]).toContain('2:00 PM');
  });
});

clinicalTest.describe('Add Appointment via UI', { tag: ['@regression'] }, () => {
  clinicalTest(
    'Book an appointment for a newly registered patient and verify it on the patient dashboard',
    async ({ clinicalSetup }) => {
      const { bahmni, page, patientId, patientUuid } = clinicalSetup;

      const { startDateTime } = generateUpcomingAppointmentDates(2, 10);
      const appointmentDate = startDateTime.split('T')[0];
      const appointmentTime = startDateTime.split('T')[1].slice(0, 5);

      await bahmni.homePage.goto();
      await page.waitForLoadState('networkidle');
      await bahmni.homePage.navigateToModule(bahmni.homePage.MODULES.APPOINTMENT_SCHEDULING);
      await page.waitForLoadState('networkidle');

      await bahmni.appointmentBookingPage.switchToAppointmentListTab();
      await bahmni.appointmentBookingPage.clickAddAppointmentButton();

      await bahmni.appointmentBookingPage.searchAndSelectPatient(patientId);
      const bookedService = await bahmni.appointmentBookingPage.selectService('General Medicine');
      await bahmni.appointmentBookingPage.setAppointmentStatus('Scheduled');
      await bahmni.appointmentBookingPage.setAppointmentDate(appointmentDate);
      await bahmni.appointmentBookingPage.setAppointmentTime(appointmentTime);
      await bahmni.appointmentBookingPage.saveAppointment();

      await bahmni.clinicalPage.gotoPatientDashboard(patientUuid);

      await bahmni.appointmentsDisplayControl.waitForWidgetToLoad();
      await bahmni.appointmentsDisplayControl.verifyUpcomingTabIsActive();

      const appointments = await bahmni.appointmentsDisplayControl.getAppointmentRows();
      const booked = bahmni.appointmentsDisplayControl.findAppointmentByServiceAndDate(
        appointments,
        bookedService,
        appointmentDate
      );

      expect(
        booked,
        `Expected a "${bookedService}" appointment on ${appointmentDate}, saw: ${JSON.stringify(appointments)}`
      ).toBeDefined();
      expect(booked?.status).toContain('Scheduled');
    }
  );

  clinicalTest(
    'Reject duplicate appointment — cannot book same patient, date, and time twice',
    async ({ clinicalSetup }) => {
      const { bahmni, page, patientId } = clinicalSetup;

      const { startDateTime } = generateUpcomingAppointmentDates(3, 10);
      const appointmentDate = startDateTime.split('T')[0];
      const appointmentTime = startDateTime.split('T')[1].slice(0, 5);

      await bahmni.homePage.goto();
      await page.waitForLoadState('networkidle');
      await bahmni.homePage.navigateToModule(bahmni.homePage.MODULES.APPOINTMENT_SCHEDULING);
      await page.waitForLoadState('networkidle');

      await bahmni.appointmentBookingPage.switchToAppointmentListTab();
      await bahmni.appointmentBookingPage.clickAddAppointmentButton();

      await bahmni.appointmentBookingPage.searchAndSelectPatient(patientId);
      await bahmni.appointmentBookingPage.selectService('General Medicine');
      await bahmni.appointmentBookingPage.setAppointmentStatus('Scheduled');
      await bahmni.appointmentBookingPage.setAppointmentDate(appointmentDate);
      await bahmni.appointmentBookingPage.setAppointmentTime(appointmentTime);
      await bahmni.appointmentBookingPage.saveAppointment();

      await bahmni.homePage.goto();
      await page.waitForLoadState('networkidle');
      await bahmni.homePage.navigateToModule(bahmni.homePage.MODULES.APPOINTMENT_SCHEDULING);
      await page.waitForLoadState('networkidle');

      await bahmni.appointmentBookingPage.switchToAppointmentListTab();
      await bahmni.appointmentBookingPage.clickAddAppointmentButton();

      await bahmni.appointmentBookingPage.searchAndSelectPatient(patientId);
      await bahmni.appointmentBookingPage.selectService('General Medicine');
      await bahmni.appointmentBookingPage.setAppointmentStatus('Scheduled');
      await bahmni.appointmentBookingPage.setAppointmentDate(appointmentDate);
      await bahmni.appointmentBookingPage.setAppointmentTime(appointmentTime);

      await bahmni.appointmentBookingPage.clickDoneButton();

      const errorModal = page.locator('text=You have an overlapping conflict').first();
      await errorModal.waitFor({ state: 'visible', timeout: 5000 });

      const errorText = await errorModal.textContent();
      expect(errorText).toBeTruthy();
      expect(errorText?.toLowerCase()).toMatch(/overlapping|conflict|overlap/i);
    }
  );

  clinicalTest('Mark appointment as missed and verify status on dashboard', async ({ clinicalSetup }) => {
    const { bahmni, page, patientId, patientUuid } = clinicalSetup;

    const { startDateTime } = generateUpcomingAppointmentDates(4, 10);
    const appointmentDate = startDateTime.split('T')[0];
    const appointmentTime = startDateTime.split('T')[1].slice(0, 5);

    await bahmni.homePage.goto();
    await page.waitForLoadState('networkidle');
    await bahmni.homePage.navigateToModule(bahmni.homePage.MODULES.APPOINTMENT_SCHEDULING);
    await page.waitForLoadState('networkidle');

    await bahmni.appointmentBookingPage.switchToAppointmentListTab();
    await bahmni.appointmentBookingPage.clickAddAppointmentButton();

    await bahmni.appointmentBookingPage.searchAndSelectPatient(patientId);
    const bookedService = await bahmni.appointmentBookingPage.selectService('General Medicine');
    await bahmni.appointmentBookingPage.setAppointmentStatus('Scheduled');
    await bahmni.appointmentBookingPage.setAppointmentDate(appointmentDate);
    await bahmni.appointmentBookingPage.setAppointmentTime(appointmentTime);
    await bahmni.appointmentBookingPage.saveAppointment();

    await page.waitForTimeout(1000);

    await bahmni.appointmentManagementPage.switchToAppointmentsListTab();
    await bahmni.appointmentManagementPage.findAndSelectAppointment(patientId, bookedService);
    await bahmni.appointmentManagementPage.markAsMissed();

    await bahmni.clinicalPage.gotoPatientDashboard(patientUuid);

    await bahmni.appointmentsDisplayControl.waitForWidgetToLoad();
    const appointments = await bahmni.appointmentsDisplayControl.getAppointmentRows();
    const missedAppointment = bahmni.appointmentsDisplayControl.findAppointmentByServiceAndDate(
      appointments,
      bookedService,
      appointmentDate
    );

    expect(
      missedAppointment,
      `Expected a "${bookedService}" appointment on ${appointmentDate}, saw: ${JSON.stringify(appointments)}`
    ).toBeDefined();
    expect(missedAppointment?.status).toContain('Missed');
  });

  clinicalTest('Mark appointment as cancelled and verify status on dashboard', async ({ clinicalSetup }) => {
    const { bahmni, page, patientId, patientUuid } = clinicalSetup;

    const { startDateTime } = generateUpcomingAppointmentDates(5, 10);
    const appointmentDate = startDateTime.split('T')[0];
    const appointmentTime = startDateTime.split('T')[1].slice(0, 5);

    await bahmni.homePage.goto();
    await page.waitForLoadState('networkidle');
    await bahmni.homePage.navigateToModule(bahmni.homePage.MODULES.APPOINTMENT_SCHEDULING);
    await page.waitForLoadState('networkidle');

    await bahmni.appointmentBookingPage.switchToAppointmentListTab();
    await bahmni.appointmentBookingPage.clickAddAppointmentButton();

    await bahmni.appointmentBookingPage.searchAndSelectPatient(patientId);
    const bookedService = await bahmni.appointmentBookingPage.selectService('General Medicine');
    await bahmni.appointmentBookingPage.setAppointmentStatus('Scheduled');
    await bahmni.appointmentBookingPage.setAppointmentDate(appointmentDate);
    await bahmni.appointmentBookingPage.setAppointmentTime(appointmentTime);
    await bahmni.appointmentBookingPage.saveAppointment();

    await page.waitForTimeout(1000);

    await bahmni.appointmentManagementPage.switchToAppointmentsListTab();
    await bahmni.appointmentManagementPage.findAndSelectAppointment(patientId, bookedService);
    await bahmni.appointmentManagementPage.markAsCancelled();

    await bahmni.clinicalPage.gotoPatientDashboard(patientUuid);

    await bahmni.appointmentsDisplayControl.waitForWidgetToLoad();
    const appointments = await bahmni.appointmentsDisplayControl.getAppointmentRows();
    const cancelledAppointment = bahmni.appointmentsDisplayControl.findAppointmentByServiceAndDate(
      appointments,
      bookedService,
      appointmentDate
    );

    expect(
      cancelledAppointment,
      `Expected a "${bookedService}" appointment on ${appointmentDate}, saw: ${JSON.stringify(appointments)}`
    ).toBeDefined();
    expect(cancelledAppointment?.status).toContain('Cancelled');
  });
});
