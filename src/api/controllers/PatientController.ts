import { BaseApiController } from './BaseApiController';
import { REST } from '../endpoints';
import { ApiResponse, UserRole } from '../types/api.types';
import { CreatePatientRequest, PatientProfileResponse, PatientSearchResponse } from '../types/patient.types';

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
}
