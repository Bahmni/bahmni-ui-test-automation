import { Page } from '@playwright/test';

export interface AppointmentData {
  patientId: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  reason?: string;
}

export class AppointmentBookingPage {
  private readonly page: Page;

  private readonly selectors = {
    // Tabs - "Appointments List" is a link/anchor element
    appointmentListTab: 'a:has-text("Appointments List")',
    appointmentCalendarTab: 'a:has-text("Awaiting Appointments")',

    // Add appointment button - "Add new appointment" is an <a> link with class add-app-btn
    addAppointmentButton: 'a.add-app-btn',
    newAppointmentButton: 'a:has-text("New Appointment")',

    // Patient search - input with data-testid="search-patient"
    patientSearchInput: '[data-testid="search-patient"]',
    patientSearchResult: '[role="option"]',

    // Service selection - combobox
    serviceContainer: '[data-testid="service-search"]',
    serviceCombobox: 'input[role="combobox"]',
    serviceOption: '[role="option"]',

    // Date and time inputs
    appointmentDateInput: 'input[placeholder="mm/dd/yyyy"]',
    dateSelector: '[data-testid="date-selector"]',
    datePicker: '[data-testid="datePicker"]',
    startTimeInput: 'input[placeholder="hh:mm"]',
    appointmentTimeInput: 'input[placeholder="hh:mm"]',

    // Appointment status - Carbon radio group; the <input> is visually hidden so it needs a forced check
    appointmentStatusContainer: '[data-testid="appointment-status"]',
    appointmentStatusScheduled: 'input[name="appointment-status-option"][value="Scheduled"]',
    appointmentStatusWaitlist: 'input[name="appointment-status-option"][value="Waitlist"]',

    // Reason/notes
    reasonTextarea: '[data-testid="appointment-reason-search"]',
    notesTextarea: 'textarea',

    // Action buttons
    saveButton: 'button:has-text("Save")',
    bookButton: 'button:has-text("Book")',
    submitButton: 'button[type="submit"]',
    cancelButton: 'button:has-text("Cancel")',

    // Success message
    successToast: '.cds--toast-notification--success',
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  async waitForPageToLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async switchToAppointmentListTab() {
    const tab = this.page.locator('a:has-text("Appointments List")');
    if ((await tab.count()) > 0) {
      await tab.click();
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(1000);
    }
  }

  async clickAddAppointmentButton() {
    const addBtn = this.page.locator('a.add-app-btn');
    await addBtn.click();

    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2000);
  }

  async searchAndSelectPatient(patientId: string) {
    const searchInput = this.page.locator('[data-testid="search-patient"]');
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.fill(patientId);

    await this.page.waitForTimeout(1000);

    const result = this.page.locator('[role="option"]').first();
    await result.waitFor({ state: 'visible', timeout: 10000 });
    await result.click();

    await this.page.waitForTimeout(500);
  }

  async selectService(serviceName: string): Promise<string> {
    const serviceContainer = this.page.locator('[data-testid="service-search"]');
    await serviceContainer.locator('input[role="combobox"]').click();

    const options = this.page.locator('[role="option"]');
    await options.first().waitFor({ state: 'visible', timeout: 10000 });

    const requested = options.filter({ hasText: serviceName }).first();
    const target = (await requested.count()) > 0 ? requested : options.first();

    const selected = (await target.textContent())?.trim() || '';
    await target.click();
    await this.page.waitForTimeout(500);

    return selected;
  }

  async setAppointmentDate(date: string) {
    let formattedDate: string;
    if (date.includes('-')) {
      const [year, month, day] = date.split('-');
      formattedDate = `${month}/${day}/${year}`;
    } else {
      formattedDate = date;
    }

    const datePickerLocator = this.page.locator('[data-testid="datePicker"]');
    const dateInput = datePickerLocator.locator('input[placeholder="mm/dd/yyyy"]').first();

    await dateInput.click();
    await dateInput.fill(formattedDate);
    await this.page.keyboard.press('Enter');

    await this.page.waitForTimeout(500);
  }

  async setAppointmentStatus(status: 'Scheduled' | 'Waitlist' = 'Scheduled') {
    const statusSelector =
      status === 'Scheduled'
        ? 'input[name="appointment-status-option"][value="Scheduled"]'
        : 'input[name="appointment-status-option"][value="Waitlist"]';

    const container = this.page.locator('[data-testid="appointment-status"]');
    const radio = container.locator(statusSelector);

    if (await radio.isChecked()) {
      return;
    }

    await container.locator(`label[for="${status}"]`).click();
    await this.page.waitForTimeout(300);

    if (!(await radio.isChecked())) {
      throw new Error(`Failed to select appointment status "${status}"`);
    }
  }

  async setAppointmentTime(time: string) {
    const timeInput = this.page.locator('input[placeholder="hh:mm"]').first();
    await timeInput.fill(time);
  }

  async setReason(reason: string) {
    const reasonInput = this.page.locator('[data-testid="appointment-reason-search"]');
    if ((await reasonInput.count()) > 0) {
      await reasonInput.fill(reason);
    }
  }

  async saveAppointment() {
    await this.clickDoneButton();

    const successMessage = this.page.locator('.cds--toast-notification--success');
    await successMessage.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  }

  async clickDoneButton() {
    const saveBtn = this.page.locator('button:has-text("Save")');
    const bookBtn = this.page.locator('button:has-text("Book")');
    const submitBtn = this.page.locator('button[type="submit"]');

    if ((await saveBtn.count()) > 0) {
      await saveBtn.click();
    } else if ((await bookBtn.count()) > 0) {
      await bookBtn.click();
    } else if ((await submitBtn.count()) > 0) {
      await submitBtn.click();
    }

    await this.page.waitForTimeout(500);
  }

  async cancelBooking() {
    await this.page.locator('button:has-text("Cancel")').click();
  }
}
