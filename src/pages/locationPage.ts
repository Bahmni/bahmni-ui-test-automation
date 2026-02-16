import { Page } from '@playwright/test';

/**
 * LocationPage class for Bahmni login location selection page
 * URL: https://docker.standard.mybahmni.in/bahmni/home/index.html#/loginLocation
 */
export class LocationPage {
  private readonly page: Page;

  // Constants for location options
  readonly LOCATION_OPTIONS = {
    ANC: 'ANC',
    EMERGENCY: 'Emergency',
    GENERAL_WARD: 'General Ward',
    OPD_1: 'OPD-1',
    OPD_2: 'OPD-2',
    PEDIATRIC_WARD: 'Pediatric Ward',
    REGISTRATION_DESK: 'Registration Desk',
  } as const;

  // Locator selectors
  private readonly selectors = {
    locationDropdown: '#location',
    continueButton: 'button:has-text("Continue")',
    pageTitle: 'text=Select login location',
    helpLink: 'a[href*="bahmni.atlassian.net"]',
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Select a location and continue
   * @param location - Location to select (e.g., 'OPD-1', 'Emergency', etc.)
   */
  async selectLocation(location: string) {
    await this.page.locator(this.selectors.locationDropdown).selectOption(location);
    await this.page.locator(this.selectors.continueButton).click();
  }
}
