import { Page } from '@playwright/test';
import { LoginPage } from './loginPage';
import { LocationPage } from './locationPage';
import { HomePage } from './homePage';
import { RegistrationSearchPage } from './registrationSearchPage';
import { CreatePatientPage } from './createPatientPage';
import { ClinicalPage } from './clinicalPage';
import { ConsultationDashboard } from './consultationDashboard';
import { NewConsultationPage } from './newConsultationPage';
import { ActivePatientsPage } from './activePatients';
import { AdmissionLetterForm } from './admissionLetterForm';
import { DeathNoteForm } from './deathNoteForm';
import { HistoryAndExaminationForm } from './historyAndExaminationForm';
import { VitalsForm } from './vitalsForm';
import { SecondVitalsForm } from './secondVitalsForm';

/**
 * PageFactory class to initialize all page objects
 * Provides a single point of access to all pages in the application
 */
export class PageFactory {
  readonly loginPage: LoginPage;
  readonly locationPage: LocationPage;
  readonly homePage: HomePage;
  readonly registrationSearchPage: RegistrationSearchPage;
  readonly createPatientPage: CreatePatientPage;
  readonly clinicalPage: ClinicalPage;
  readonly consultationDashboard: ConsultationDashboard;
  readonly newConsultationPage: NewConsultationPage;
  readonly activePatientsPage: ActivePatientsPage;
  readonly admissionLetterForm: AdmissionLetterForm;
  readonly deathNoteForm: DeathNoteForm;
  readonly historyAndExaminationForm: HistoryAndExaminationForm;
  readonly vitalsForm: VitalsForm;
  readonly secondVitalsForm: SecondVitalsForm;

  constructor(page: Page) {
    this.loginPage = new LoginPage(page);
    this.locationPage = new LocationPage(page);
    this.homePage = new HomePage(page);
    this.registrationSearchPage = new RegistrationSearchPage(page);
    this.createPatientPage = new CreatePatientPage(page);
    this.clinicalPage = new ClinicalPage(page);
    this.consultationDashboard = new ConsultationDashboard(page);
    this.newConsultationPage = new NewConsultationPage(page);
    this.activePatientsPage = new ActivePatientsPage(page);
    this.admissionLetterForm = new AdmissionLetterForm(page);
    this.deathNoteForm = new DeathNoteForm(page);
    this.historyAndExaminationForm = new HistoryAndExaminationForm(page);
    this.vitalsForm = new VitalsForm(page);
    this.secondVitalsForm = new SecondVitalsForm(page);
  }
}
