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
import { ImplementerInterfacePage } from './implementerInterfacePage';
import { AdmissionLetterForm } from './obsForms/admissionLetterForm';
import { DeathNoteForm } from './obsForms/deathNoteForm';
import { DiabetesProgressForm } from './obsForms/diabetesProgressForm';
import { FitnessEvaluationObsFormPage } from './obsForms/fitnessEvaluationObsFormPage';
import { HistoryAndExaminationForm } from './obsForms/historyAndExaminationForm';
import { MalariaForm } from './obsForms/malariaForm';
import { VitalsForm } from './obsForms/vitalsForm';
import { SecondVitalsForm } from './obsForms/secondVitalsForm';
import { PatientDocumentsPage } from './patientDocumentsPage';
import { AppointmentsDisplayControlPage } from './appointmentsDisplayControlPage';
import { LabEntryHomePage } from './labEntryHomePage';
import { LabEntryPatientPage } from './labEntryPatientPage';

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
  readonly implementerInterfacePage: ImplementerInterfacePage;
  readonly admissionLetterForm: AdmissionLetterForm;
  readonly deathNoteForm: DeathNoteForm;
  readonly diabetesProgressForm: DiabetesProgressForm;
  readonly fitnessEvaluationObsFormPage: FitnessEvaluationObsFormPage;
  readonly historyAndExaminationForm: HistoryAndExaminationForm;
  readonly malariaForm: MalariaForm;
  readonly vitalsForm: VitalsForm;
  readonly secondVitalsForm: SecondVitalsForm;
  readonly patientDocumentsPage: PatientDocumentsPage;
  readonly appointmentsDisplayControl: AppointmentsDisplayControlPage;
  readonly labEntryHomePage: LabEntryHomePage;
  readonly labEntryPatientPage: LabEntryPatientPage;

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
    this.implementerInterfacePage = new ImplementerInterfacePage(page);
    this.admissionLetterForm = new AdmissionLetterForm(page);
    this.deathNoteForm = new DeathNoteForm(page);
    this.diabetesProgressForm = new DiabetesProgressForm(page);
    this.fitnessEvaluationObsFormPage = new FitnessEvaluationObsFormPage(page);
    this.historyAndExaminationForm = new HistoryAndExaminationForm(page);
    this.malariaForm = new MalariaForm(page);
    this.vitalsForm = new VitalsForm(page);
    this.secondVitalsForm = new SecondVitalsForm(page);
    this.patientDocumentsPage = new PatientDocumentsPage(page);
    this.appointmentsDisplayControl = new AppointmentsDisplayControlPage(page);
    this.labEntryHomePage = new LabEntryHomePage(page);
    this.labEntryPatientPage = new LabEntryPatientPage(page);
  }
}
