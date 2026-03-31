import { test, expect } from '../../../src/fixtures/appointmentFixture';

test.describe('Appointments Display Control', () => {
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
    expect(upcomingSlots[1]).toContain('02:00 PM');

    await widget.clickPastTab();
    const pastAppointments = await widget.getAppointmentRows();
    expect(pastAppointments).toHaveLength(2);
    expect(pastAppointments[0].status).toContain('Completed');
    expect(pastAppointments[1].status).toContain('Completed');
    const pastSlots = pastAppointments.map((a) => a.appointmentSlot);
    expect(pastSlots[0]).toContain('10:00 AM');
    expect(pastSlots[1]).toContain('02:00 PM');
  });
});
