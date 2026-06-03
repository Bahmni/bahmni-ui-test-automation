import { APIRequestContext } from '@playwright/test';
import { PatientController } from './controllers/PatientController';
import { VisitController } from './controllers/VisitController';
import { LocationController } from './controllers/LocationController';
import { FhirController } from './controllers/FhirController';
import { UserController } from './controllers/UserController';
import { BahmniFormsController } from './controllers/BahmniFormsController';
import { AppointmentController } from './controllers/AppointmentController';
import { ProgramEnrollmentController } from './controllers/ProgramEnrollmentController';
import { ConceptController } from './controllers/ConceptController';

export class ApiFactory {
  readonly patient: PatientController;
  readonly visit: VisitController;
  readonly location: LocationController;
  readonly fhir: FhirController;
  readonly user: UserController;
  readonly forms: BahmniFormsController;
  readonly appointment: AppointmentController;
  readonly program: ProgramEnrollmentController;
  readonly concept: ConceptController;

  constructor(request: APIRequestContext) {
    this.patient = new PatientController(request);
    this.visit = new VisitController(request);
    this.location = new LocationController(request);
    this.fhir = new FhirController(request);
    this.user = new UserController(request);
    this.forms = new BahmniFormsController(request);
    this.appointment = new AppointmentController(request);
    this.program = new ProgramEnrollmentController(request);
    this.concept = new ConceptController(request);
  }
}
