import { PageFactory } from '../pages/PageFactory';
import { AuthActions } from './authActions';
import { RegistrationActions } from './registrationActions';
import { ClinicalActions } from './clinicalActions';
import { ObservationActions } from './observationActions';

export class ActionFactory {
  readonly auth: AuthActions;
  readonly registration: RegistrationActions;
  readonly clinical: ClinicalActions;
  readonly observation: ObservationActions;

  constructor(pageFactory: PageFactory) {
    this.auth = new AuthActions(pageFactory);
    this.registration = new RegistrationActions(pageFactory);
    this.clinical = new ClinicalActions(pageFactory);
    this.observation = new ObservationActions(pageFactory);
  }
}
