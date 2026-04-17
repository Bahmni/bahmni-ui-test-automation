import { APIRequestContext } from '@playwright/test';
import { PatientController } from './controllers/PatientController';
import { VisitController } from './controllers/VisitController';
import { LocationController } from './controllers/LocationController';
import { FhirController } from './controllers/FhirController';

export class ApiFactory {
  readonly patient: PatientController;
  readonly visit: VisitController;
  readonly location: LocationController;
  readonly fhir: FhirController;

  constructor(request: APIRequestContext) {
    this.patient = new PatientController(request);
    this.visit = new VisitController(request);
    this.location = new LocationController(request);
    this.fhir = new FhirController(request);
  }
}
