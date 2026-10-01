import { BaseApiController } from './BaseApiController';
import { FHIR, REST } from '../endpoints';
import { ApiResponse, UserRole } from '../types/api.types';
import { RelatedPersonResource, RelatedPersonSearchBundle, RelationshipType } from '../types/related-person.types';

export class RelatedPersonController extends BaseApiController {
  async create(
    payload: Record<string, unknown>,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<RelatedPersonResource>> {
    return this.post<RelatedPersonResource>(FHIR.relatedPerson, payload, role, 'application/fhir+json');
  }

  // Never throws — for negative tests asserting on 4xx/5xx status and OperationOutcome body.
  async createRaw(
    payload: Record<string, unknown>,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<RelatedPersonResource & { issue?: Array<{ diagnostics?: string }> }>> {
    return this.postRaw(FHIR.relatedPerson, payload, role, 'application/fhir+json');
  }

  async getByIdRaw(id: string, role: UserRole = 'admin'): Promise<ApiResponse<RelatedPersonResource>> {
    return this.getRawFhir<RelatedPersonResource>(`${FHIR.relatedPerson}/${id}`, role);
  }

  // `patientParam` is passed verbatim so tests can send `Patient/{uuid}`, a bare uuid, or garbage.
  async searchByPatientRaw(
    patientParam: string,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<RelatedPersonSearchBundle & { issue?: Array<{ diagnostics?: string }> }>> {
    return this.getRawFhir(`${FHIR.relatedPerson}?patient=${encodeURIComponent(patientParam)}&_count=100`, role);
  }

  async searchWithoutParamRaw(
    role: UserRole = 'admin'
  ): Promise<ApiResponse<{ issue?: Array<{ diagnostics?: string }> }>> {
    return this.getRawFhir(FHIR.relatedPerson, role);
  }

  async updateRaw(
    id: string,
    payload: Record<string, unknown>,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<RelatedPersonResource & { issue?: Array<{ diagnostics?: string }> }>> {
    return this.putRaw(`${FHIR.relatedPerson}/${id}`, payload, role);
  }

  async deleteRaw(id: string, role: UserRole = 'admin'): Promise<ApiResponse<void>> {
    return this.delRaw(`${FHIR.relatedPerson}/${id}`, role);
  }

  async getRelationshipTypes(role: UserRole = 'admin'): Promise<ApiResponse<{ results: RelationshipType[] }>> {
    return this.get(`${REST.relationshipType}?v=custom:(uuid,aIsToB,bIsToA)`, role);
  }
}
