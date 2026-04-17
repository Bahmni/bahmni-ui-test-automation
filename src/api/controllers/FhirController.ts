import { BaseApiController } from './BaseApiController';
import { FHIR } from '../endpoints';
import { ApiResponse, UserRole } from '../types/api.types';
import { FhirBundle, FhirBundleResponse } from '../types/fhir.types';

export class FhirController extends BaseApiController {
  async getEncounters(
    patientUuid: string,
    count = 1,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<FhirBundleResponse>> {
    return this.get<FhirBundleResponse>(`${FHIR.encounter}?patient=${patientUuid}&_sort=-date&_count=${count}`, role);
  }

  async getServiceRequests(
    patientUuid: string,
    count = 10,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<FhirBundleResponse>> {
    return this.get<FhirBundleResponse>(
      `${FHIR.serviceRequest}?patient=${patientUuid}&_sort=-date&_count=${count}`,
      role
    );
  }

  async submitDiagnosticReport(bundle: FhirBundle, role: UserRole = 'admin'): Promise<ApiResponse<FhirBundleResponse>> {
    return this.post<FhirBundleResponse>(FHIR.submitBundle, bundle, role, 'application/fhir+json');
  }

  async submitDiagnosticReportRaw(
    bundle: FhirBundle,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<FhirBundleResponse>> {
    return this.postRaw<FhirBundleResponse>(FHIR.submitBundle, bundle, role, 'application/fhir+json');
  }
}
