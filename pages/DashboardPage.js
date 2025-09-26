class DashboardPage {
  constructor(page) {
    this.page = page;
    this.dashboardTitle = '.dashboard-title';
    this.clinical='//a[@id="bahmni.clinical"]';
    this.continue ='//button[text()="Continue"]';
  }

  async getDashboardTitle() {
    return await this.page.textContent(this.dashboardTitle);
  }
}

module.exports = DashboardPage;