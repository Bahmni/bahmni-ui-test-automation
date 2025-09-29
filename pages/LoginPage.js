class LoginPage {
  constructor(page) {
    this.page = page;
    this.usernameInput = '#username'; // Selector for username input
    this.passwordInput = '#password'; // Selector for password input
    this.loginButton = '//button[text()="Login"]'; // Selector for login button
    this.clinicalServiceLink = '//a[@href="/bahmni/home"]'; // Example selector
  }

  async navigateToLogin(baseURL) {
    await this.page.goto(baseURL); // Navigate to the login page
  }

  async login(username, password) {
    await this.page.click(this.clinicalServiceLink); // Click Clinical Service link
    await this.page.fill(this.usernameInput, username); // Fill username
    await this.page.fill(this.passwordInput, password); // Fill password
    await this.page.click(this.loginButton); // Click login button
  }
}

export default LoginPage;
