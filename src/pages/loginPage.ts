import { Page } from '@playwright/test';
import { config } from '../config/env.config';

/**
 * LoginPage class for Bahmni EMR login page
 */
export class LoginPage {
  private readonly page: Page;

  // Constants for locale options
  readonly LOCALE_OPTIONS = {
    ENGLISH: 'string:en',
    SPANISH: 'string:es',
    FRENCH: 'string:fr',
    ITALIAN: 'string:it',
    PORTUGUESE: 'string:pt_BR',
    CHINESE: 'string:zh',
    HINDI: 'string:hi',
  } as const;

  // Locator selectors
  private readonly selectors = {
    usernameInput: '#username',
    passwordInput: '#password',
    localeDropdown: '#locale',
    loginButton: 'button[type="submit"]',
    pageTitle: 'text=BAHMNI EMR LOGIN',
    helpLink: 'a[href*="bahmni.atlassian.net"]',
  } as const;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to the login page
   */
  async goto() {
    await this.page.goto(config.urls.login);
  }

  /**
   * Perform complete login action
   * @param username - Username to login with
   * @param password - Password to login with
   * @param locale - Optional locale selection (defaults to English)
   */
  async login(username: string, password: string, locale?: string) {
    if (locale) {
      await this.page.locator(this.selectors.localeDropdown).selectOption(locale);
    }
    await this.page.locator(this.selectors.usernameInput).fill(username);
    await this.page.locator(this.selectors.passwordInput).fill(password);
    await this.page.locator(this.selectors.loginButton).first().click();
  }
}
