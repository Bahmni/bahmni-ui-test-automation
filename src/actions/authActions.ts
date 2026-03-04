import { PageFactory } from '../pages/PageFactory';
import { config } from '../config/env.config';

export class AuthActions {
  constructor(private readonly bahmni: PageFactory) {}

  async loginAsAdmin() {
    const adminUser = config.getUser('admin');
    await this.bahmni.loginPage.goto();
    await this.bahmni.loginPage.login(adminUser.username, adminUser.password);
    await this.bahmni.locationPage.selectLocation(config.defaults.location);
  }
}
