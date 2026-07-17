import { Page, Locator } from '@playwright/test';
import {
  LabValueEntry,
  CbcPanelResults,
  CBC_CONCEPT_UUIDS,
  TSH_CONCEPT_UUID,
} from '../../../test-data/common/labEntryData';

export class LabEntryPatientPage {
  private readonly page: Page;

  private readonly selectors = {
    pendingOrdersTable: 'table[title="lab-order-table"]',
    pendingOrderRow: (testName: string) => `table[title="lab-order-table"] tbody tr:has(td:text-is("${testName}"))`,
    enterTestResultsButton: 'button:has-text("Enter Test Results")',
    overlay: '[aria-label="overlay"]',
    valueInput: (conceptUuid: string) => `[aria-label="overlay"] input[id^="${conceptUuid}-"]`,
    abnormalCheckbox: (conceptUuid: string) => `[aria-label="overlay"] input#abnormal-${conceptUuid}`,
    reportDateInput: '[aria-label="overlay"] input#reportDate',
    flatpickrCalendar: '.flatpickr-calendar.open',
    flatpickrToday: '.flatpickr-calendar.open .flatpickr-day.today',
    saveButton: '[aria-label="overlay"] button:has-text("Save and Upload")',
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  async waitForLoaded() {
    await this.page.locator(this.selectors.pendingOrdersTable).waitFor({ state: 'visible', timeout: 15000 });
  }

  getPendingOrderRow(testName: string): Locator {
    return this.page.locator(this.selectors.pendingOrderRow(testName));
  }

  async selectPendingOrder(testName: string) {
    const row = this.getPendingOrderRow(testName);
    await row.waitFor({ state: 'visible', timeout: 10000 });
    await row.locator('label.bx--checkbox-label').click();
  }

  async clickEnterTestResults() {
    await this.page.locator(this.selectors.enterTestResultsButton).first().click();
    await this.page.locator(this.selectors.overlay).waitFor({ state: 'visible', timeout: 10000 });
  }

  async fillTshResult(entry: LabValueEntry) {
    await this.fillValueByConcept(TSH_CONCEPT_UUID, entry);
  }

  async fillCbcResults(results: CbcPanelResults) {
    for (const [key, entry] of Object.entries(results) as [keyof CbcPanelResults, LabValueEntry][]) {
      await this.fillValueByConcept(CBC_CONCEPT_UUIDS[key], entry);
    }
  }

  private async fillValueByConcept(conceptUuid: string, entry: LabValueEntry) {
    const input = this.page.locator(this.selectors.valueInput(conceptUuid)).first();
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill(entry.value.toString());
    if (entry.abnormal) {
      await this.page.locator(this.selectors.abnormalCheckbox(conceptUuid)).first().check();
    }
  }

  async selectTodayAsReportDate() {
    await this.page.locator(this.selectors.reportDateInput).click();
    await this.page.locator(this.selectors.flatpickrCalendar).waitFor({ state: 'visible', timeout: 5000 });
    await this.page.locator(this.selectors.flatpickrToday).click();
    await this.page.locator(this.selectors.flatpickrCalendar).waitFor({ state: 'hidden', timeout: 5000 });
  }

  async saveAndUpload() {
    await this.page.locator(this.selectors.saveButton).first().click();
    await this.page.locator(this.selectors.overlay).waitFor({ state: 'hidden', timeout: 15000 });
  }
}
