import { expect } from '../fixtures/expectExtensions';
import { PageFactory } from '../pages/PageFactory';
import { CbcPanelResults, LabValueEntry } from '../../../test-data/common/labEntryData';

export class LabEntryActions {
  constructor(private readonly bahmni: PageFactory) {}

  async navigateToPatientLabEntry(patientId: string) {
    await this.bahmni.homePage.goto();
    await this.bahmni.homePage.navigateToModule(this.bahmni.homePage.MODULES.LAB_ENTRY);
    await this.bahmni.labEntryHomePage.waitForActivePatientList();
    await this.bahmni.labEntryHomePage.openPatient(patientId);
    await this.bahmni.labEntryPatientPage.waitForLoaded();
  }

  async enterTshResult(entry: LabValueEntry) {
    await this.bahmni.labEntryPatientPage.selectPendingOrder('TSH test');
    await this.bahmni.labEntryPatientPage.clickEnterTestResults();
    await this.bahmni.labEntryPatientPage.fillTshResult(entry);
    await this.bahmni.labEntryPatientPage.selectTodayAsReportDate();
    await this.bahmni.labEntryPatientPage.saveAndUpload();
  }

  async enterCbcResults(results: CbcPanelResults) {
    await this.bahmni.labEntryPatientPage.selectPendingOrder('CBC');
    await this.bahmni.labEntryPatientPage.clickEnterTestResults();
    await this.bahmni.labEntryPatientPage.fillCbcResults(results);
    await this.bahmni.labEntryPatientPage.selectTodayAsReportDate();
    await this.bahmni.labEntryPatientPage.saveAndUpload();
  }

  async verifyOrderRemovedFromPending(testName: string) {
    await expect(this.bahmni.labEntryPatientPage.getPendingOrderRow(testName)).toHaveCount(0, { timeout: 15000 });
  }
}
