import { BaseApiController } from './BaseApiController';
import { REST } from '../endpoints';
import { ApiResponse, UserRole } from '../types/api.types';
import {
  CreatePatientRequest,
  PatientProfileResponse,
  PatientSearchResponse,
  RelationshipTypeResponse,
} from '../types/patient.types';

export class PatientController extends BaseApiController {
  async create(payload: CreatePatientRequest, role: UserRole = 'admin'): Promise<ApiResponse<PatientProfileResponse>> {
    return this.post<PatientProfileResponse>(REST.patientProfile, payload, role);
  }

  async createRaw(
    payload: CreatePatientRequest,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<PatientProfileResponse>> {
    return this.postRaw<PatientProfileResponse>(REST.patientProfile, payload, role);
  }

  async getById(uuid: string, role: UserRole = 'admin'): Promise<ApiResponse<PatientProfileResponse>> {
    return this.get<PatientProfileResponse>(`${REST.patient}/${uuid}?v=full`, role);
  }

  async search(query: string, role: UserRole = 'admin'): Promise<ApiResponse<PatientSearchResponse>> {
    return this.get<PatientSearchResponse>(`${REST.patient}?q=${encodeURIComponent(query)}&v=default`, role);
  }

  async delete(uuid: string, role: UserRole = 'admin'): Promise<ApiResponse<void>> {
    return this.del(`${REST.patient}/${uuid}`, role);
  }

  async getProfileById(uuid: string, role: UserRole = 'admin'): Promise<ApiResponse<PatientProfileResponse>> {
    return this.get<PatientProfileResponse>(`${REST.patientProfileGet}/${uuid}?v=full`, role);
  }

  async getRelationshipTypes(role: UserRole = 'admin'): Promise<ApiResponse<RelationshipTypeResponse>> {
    return this.get<RelationshipTypeResponse>(`${REST.relationshipType}?v=custom:(aIsToB,bIsToA,uuid)&limit=150`, role);
  }

  async getRelationshipsForPerson(
    personUuid: string,
    role: UserRole = 'admin'
  ): Promise<
    ApiResponse<{
      results: Array<{
        uuid: string;
        personA: { uuid: string };
        personB: { uuid: string };
        relationshipType: { uuid: string };
      }>;
    }>
  > {
    return this.get(`${REST.relationship}?v=full&person=${personUuid}`, role);
  }
}
