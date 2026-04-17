import { Page } from '@playwright/test';

/**
 * ConsultationDashboard class for Bahmni consultation dashboard page
 * URL: https://docker.standard.mybahmni.in/bahmni-new/clinical/{patientUuid}
 */
export class ConsultationDashboard {
  private readonly page: Page;

  // Locator selectors - No IDs available, using text-based selectors
  private readonly selectors = {
    // Header elements
    newConsultationButton: 'button:has-text("New Consultation")',
    searchButton: 'button:has-text("Search")',
    notificationsButton: 'button:has-text("Notifications")',
    userButton: 'button:has-text("User")',

    // Sidebar navigation links
    allergiesLink: 'a:has-text("Allergies")',
    programsLink: 'a:has-text("Programs")',
    formsLink: 'a:has-text("Forms")',
    conditionsAndDiagnosesLink: 'a:has-text("Conditions and Diagnoses")',
    medicationsLink: 'a:has-text("Medications")',
    proceduresLink: 'a:has-text("Procedures")',
    labInvestigationsLink: 'a:has-text("Lab Investigations")',
    radiologyInvestigationsLink: 'a:has-text("Radiology Investigations")',
    vitalsFlowSheetLink: 'a:has-text("Vitals Flow Sheet")',
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Click New Consultation button
   */
  async clickNewConsultation() {
    await this.page.locator(this.selectors.newConsultationButton).click();
  }
}
