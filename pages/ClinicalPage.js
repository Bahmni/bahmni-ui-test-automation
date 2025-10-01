export class ClinicalPage {
  constructor(page) {
    this.page = page;
    this.tabItem = '//li[@class="tab-item"][1]/a';
    this.activePatient = '//li[@class="active-patient"][1]';
  }
}
export default ClinicalPage;
