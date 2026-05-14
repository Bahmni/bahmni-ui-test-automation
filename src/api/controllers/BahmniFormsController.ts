import { BaseApiController } from './BaseApiController';
import { REST } from '../endpoints';
import { ApiResponse, UserRole } from '../types/api.types';

export interface PatientFormEntry {
  formType: string;
  formName: string;
  formVersion: number;
  visitUuid: string;
  visitStartDateTime: number;
  encounterUuid: string;
  encounterDateTime: number;
  providers: Array<{ providerName: string; uuid: string }>;
}

export class BahmniFormsController extends BaseApiController {
  async getForms(
    patientUuid: string,
    numberOfVisits = 10,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<PatientFormEntry[]>> {
    return this.get<PatientFormEntry[]>(
      `${REST.bahmnicorePatient}/${patientUuid}/forms?numberOfVisits=${numberOfVisits}`,
      role
    );
  }
}
