class PatientRegistrationPage {
  constructor(page) {
    this.page = page;
    this.firstNameInput = '#first_name';
    this.lastNameInput = '#last_name';
    this.emailInput = '#email';
    this.registerButton = '#register-button';
  }

  async navigateToRegistration() {
    await this.page.goto('https://example.com/patient/register');
  }

  async registerPatient(firstName, lastName, email) {
    await this.page.fill(this.firstNameInput, firstName);
    await this.page.fill(this.lastNameInput, lastName);
    await this.page.fill(this.emailInput, email);
    await this.page.click(this.registerButton);
  }
}

module.exports = PatientRegistrationPage;
