import { BaseApiController } from './BaseApiController';
import { REST } from '../endpoints';
import { ApiResponse, UserRole } from '../types/api.types';
import { CreateVisitRequest, VisitResponse, VisitTypeResponse } from '../types/visit.types';

export class VisitController extends BaseApiController {
  async create(payload: CreateVisitRequest, role: UserRole = 'admin'): Promise<ApiResponse<VisitResponse>> {
    return this.post<VisitResponse>(REST.visit, payload, role);
  }

  async getById(uuid: string, role: UserRole = 'admin'): Promise<ApiResponse<VisitResponse>> {
    return this.get<VisitResponse>(`${REST.visit}/${uuid}?v=full`, role);
  }

  async getActiveByPatient(patientUuid: string, role: UserRole = 'admin'): Promise<ApiResponse<VisitResponse>> {
    const response = await this.get<{ results: VisitResponse[] }>(
      `${REST.visit}?patient=${patientUuid}&includeInactive=false&v=full`,
      role
    );
    if (!response.body.results.length) {
      throw new Error(`No active visits found for patient ${patientUuid}`);
    }
    return { status: response.status, body: response.body.results[0] };
  }

  async getVisitTypes(role: UserRole = 'admin'): Promise<ApiResponse<VisitTypeResponse>> {
    return this.get<VisitTypeResponse>(REST.visitType, role);
  }

  async getActiveByPatientRaw(
    patientUuid: string,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<{ results: VisitResponse[] }>> {
    return this.get<{ results: VisitResponse[] }>(
      `${REST.visit}?patient=${patientUuid}&includeInactive=false&v=custom:(uuid,visitType,startDatetime,stopDatetime)`,
      role
    );
  }

  async getVisitLocation(loginLocationUuid: string, role: UserRole = 'admin'): Promise<ApiResponse<{ uuid: string }>> {
    return this.get<{ uuid: string }>(`${REST.visitLocation}/${loginLocationUuid}`, role);
  }

  async end(uuid: string, role: UserRole = 'admin'): Promise<ApiResponse<VisitResponse>> {
    return this.post<VisitResponse>(`${REST.visit}/${uuid}`, { stopDatetime: new Date().toISOString() }, role);
  }

  async endVisit(uuid: string, role: UserRole = 'admin'): Promise<ApiResponse<VisitResponse>> {
    return this.post<VisitResponse>(`${REST.visitEnd}?visitUuid=${uuid}`, { withCredentials: true }, role);
  }
}
