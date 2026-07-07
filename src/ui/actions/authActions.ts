import { PageFactory } from '../pages/PageFactory';
import { config } from '../../config/env.config';

export class AuthActions {
  constructor(private readonly bahmni: PageFactory) {}

  private async loginAs(username: string, password: string) {
    await this.bahmni.loginPage.goto();
    await this.bahmni.loginPage.login(username, password);
    await this.bahmni.locationPage.selectLocation(config.defaults.location);
  }

  async loginAsAdmin() {
    const user = config.getUser('admin');
    await this.loginAs(user.username, user.password);
  }

  async loginAsFrontDesk() {
    const user = config.getUser('frontdesk');
    await this.loginAs(user.username, user.password);
  }

  async loginAsDoctor() {
    const user = config.getUser('doctor');
    await this.loginAs(user.username, user.password);
  }

  async loginAsClinicalRead() {
    const user = config.getUser('clinicalRead');
    await this.loginAs(user.username, user.password);
  }

  async logout() {
    await this.bahmni.homePage.goto();
    await this.bahmni.homePage.logout();
    await this.bahmni.loginPage.waitForPage();
  }
}
