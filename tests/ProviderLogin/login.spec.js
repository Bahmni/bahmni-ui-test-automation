//login to bahmni using playwright and page object model
import { test, expect } from '@playwright/test';
import envConfig from '../../config/env.config.js'; // Import environment configuration
import LoginPage from '../../pages/LoginPage.js'; // Import LoginPage page object
import DashboardPage from '../../pages/DashboardPage.js';
import ClinicalPage from '../../pages/ClinicalPage.js'; // Import ClinicalPage page object
const environment = 'uat'; // Change to 'uat'
const { baseURL, username, password } = envConfig[environment];     
test('Provider login test using Page Object Model', async ({ page }) => {
  const loginPage = new LoginPage(page); // Initialize the LoginPage object
  const dashboardPage = new DashboardPage(page); // Initialize the DashboardPage object
  const clinicalPage = new ClinicalPage(page); // Initialize the ClinicalPage object


  await page.goto(baseURL); // Navigate to the login page
 
  //maximize the browser window
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.click(loginPage.clinicalServiceLink); // Click Clinical Service link
  await page.fill(loginPage.usernameInput, username); // Fill username
  await page.fill(loginPage.passwordInput, password); // Fill password

  await page.click(loginPage.loginButton); // Click login button

  await page.getByLabel('Location *').selectOption('Emergency Ward');

//await page.selectOption('//select[@id="location"]', { value: 'General Ward' });
  await page.click(dashboardPage.continue); // Click continue button');
  await page.click(dashboardPage.clinical); // Click Clinical link
  await page.click(clinicalPage.tabItem); // Click on the first tab item
  await page.click(clinicalPage.activePatient); // Click on the active patient  

  

});

