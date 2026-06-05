import { BaseApiController } from './BaseApiController';
import { FHIR, REST } from '../endpoints';
import { ApiResponse, UserRole } from '../types/api.types';
import {
  CreatePatientRequest,
  FhirPatientResponse,
  FhirPatientSearchResponse,
  IdgenIdentifierResponse,
  UpdatePatientRequest,
} from '../types/patient.types';

export class PatientController extends BaseApiController {
  async generateIdentifier(sourceUuid: string, role: UserRole = 'admin'): Promise<string> {
    const { body } = await this.post<IdgenIdentifierResponse>(
      `${REST.idgenIdentifierSource}/${sourceUuid}/identifier`,
      {},
      role
    );
    return body.identifier;
  }

  async create(payload: CreatePatientRequest, role: UserRole = 'admin'): Promise<ApiResponse<FhirPatientResponse>> {
    return this.post<FhirPatientResponse>(FHIR.patient, payload, role, 'application/fhir+json');
  }

  async createRaw(payload: CreatePatientRequest, role: UserRole = 'admin'): Promise<ApiResponse<FhirPatientResponse>> {
    return this.postRaw<FhirPatientResponse>(FHIR.patient, payload, role, 'application/fhir+json');
  }

  async getById(uuid: string, role: UserRole = 'admin'): Promise<ApiResponse<FhirPatientResponse>> {
    return this.getFhir<FhirPatientResponse>(`${FHIR.patient}/${uuid}`, role);
  }

  async update(
    uuid: string,
    payload: UpdatePatientRequest,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<FhirPatientResponse>> {
    return this.put<FhirPatientResponse>(`${FHIR.patient}/${uuid}`, payload, role);
  }

  async search(identifier: string, role: UserRole = 'admin'): Promise<ApiResponse<FhirPatientSearchResponse>> {
    return this.getFhir<FhirPatientSearchResponse>(
      `${FHIR.patient}?identifier=${encodeURIComponent(identifier)}`,
      role
    );
  }

  async delete(uuid: string, role: UserRole = 'admin'): Promise<ApiResponse<void>> {
    return this.del(`${REST.patient}/${uuid}`, role);
  }
}
