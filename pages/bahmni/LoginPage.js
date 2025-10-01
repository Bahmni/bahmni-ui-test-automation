export class LoginPage {
  constructor(page) {
    this.page = page;
    this.userName = page.locator('#username');
    this.password = page.locator('#password');
    this.signIn = page.locator("(//button[normalize-space()='Login'])[1]");
  }

  async lanuch(url) {
    await this.page.goto(url);
  }
  async validLogin(user, pwd) {
    await this.userName.fill(user);
    await this.password.fill(pwd);
    await this.signIn.click();
    await this.page.waitForLoadState('networkidle');
  }
}
export default LoginPage;

//module.exports = { LoginPage }
