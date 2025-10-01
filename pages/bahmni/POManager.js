import LoginPage from '../bahmni/LoginPage';

export class POManager {
  constructor(page) {
    this.page = page;
    this.loginPage = new LoginPage(page);
  }

  getLoginPage() {
    return this.loginPage;
  }
}

export default POManager;
