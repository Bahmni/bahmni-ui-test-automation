import { BaseApiController } from './BaseApiController';
import { FHIR } from '../endpoints';
import { ApiResponse, UserRole } from '../types/api.types';
import { FhirBundle, FhirBundleResponse } from '../types/fhir.types';
import { SERVICE_REQUEST_CATEGORIES } from '../../../test-data/api/constants';

export class FhirController extends BaseApiController {
  async getPatient(patientUuid: string, role: UserRole = 'admin'): Promise<ApiResponse<FhirBundleResponse>> {
    return this.getFhir<FhirBundleResponse>(`${FHIR.patient}/${patientUuid}`, role);
  }

  async getEncounters(
    patientUuid: string,
    count = 1,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<FhirBundleResponse>> {
    return this.getFhir<FhirBundleResponse>(
      `${FHIR.encounter}?patient=${patientUuid}&_sort=-date&_count=${count}`,
      role
    );
  }

  async getVisitEncounters(patientUuid: string, role: UserRole = 'admin'): Promise<ApiResponse<FhirBundleResponse>> {
    return this.getFhir<FhirBundleResponse>(`${FHIR.encounter}?subject:Patient=${patientUuid}&_tag=visit`, role);
  }

  async getAllergyIntolerances(
    patientUuid: string,
    count?: number,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<FhirBundleResponse>> {
    const countParam = count !== undefined ? `&_count=${count}` : '';
    return this.getFhir<FhirBundleResponse>(
      `${FHIR.allergyIntolerance}?patient=${patientUuid}${countParam}&_sort=-_lastUpdated`,
      role
    );
  }

  async getValueSetExpansion(
    valueSetUuid: string,
    role: UserRole = 'admin'
  ): Promise<
    ApiResponse<{ resourceType: string; expansion?: { contains?: Array<{ code: string; display?: string }> } }>
  > {
    return this.getFhir(`${FHIR.valueSet}/${valueSetUuid}/$expand`, role);
  }

  async getConditions(
    patientUuid: string,
    category: 'problem-list-item' | 'encounter-diagnosis',
    count = 100,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<FhirBundleResponse>> {
    return this.getFhir<FhirBundleResponse>(
      `${FHIR.condition}?category=${category}&patient=${patientUuid}&_count=${count}&_sort=-_lastUpdated`,
      role
    );
  }

  async getMedicationRequests(
    patientUuid: string,
    count = 100,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<FhirBundleResponse>> {
    return this.getFhir<FhirBundleResponse>(
      `${FHIR.medicationRequest}?_sort=-_lastUpdated&_count=${count}&_include=MedicationRequest:medication&patient=${patientUuid}`,
      role
    );
  }

  async getServiceRequests(
    patientUuid: string,
    count = 100,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<FhirBundleResponse>> {
    return this.getFhir<FhirBundleResponse>(
      `${FHIR.serviceRequest}?patient=${patientUuid}&_sort=-date&_count=${count}`,
      role
    );
  }

  async getLabServiceRequests(
    patientUuid: string,
    count = 100,
    encounterUuid?: string,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<FhirBundleResponse>> {
    const encounterFilter = encounterUuid ? `&encounter=${encounterUuid}` : '';
    return this.getFhir<FhirBundleResponse>(
      `${FHIR.serviceRequest}?_count=${count}&_sort=-_lastUpdated&category=${SERVICE_REQUEST_CATEGORIES.lab}&patient=${patientUuid}${encounterFilter}`,
      role
    );
  }

  async getRadiologyServiceRequests(
    patientUuid: string,
    count = 100,
    encounterUuid?: string,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<FhirBundleResponse>> {
    const encounterFilter = encounterUuid ? `&encounter=${encounterUuid}` : '';
    return this.getFhir<FhirBundleResponse>(
      `${FHIR.serviceRequest}?_count=${count}&_sort=-_lastUpdated&category=${SERVICE_REQUEST_CATEGORIES.radiology}&patient=${patientUuid}&_revinclude=ImagingStudy:basedon${encounterFilter}`,
      role
    );
  }

  async getObservations(
    patientUuid: string,
    codes: string[],
    count = 100,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<FhirBundleResponse>> {
    return this.getFhir<FhirBundleResponse>(
      `${FHIR.observation}?patient=${patientUuid}&code=${codes.join(',')}&_include=Observation:has-member&_include=Observation:encounter&_sort=-_lastUpdated&_count=${count}`,
      role
    );
  }

  async getDiagnosticReports(
    patientUuid: string,
    serviceRequestUuid: string,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<FhirBundleResponse>> {
    return this.getFhir<FhirBundleResponse>(
      `${FHIR.diagnosticReport}?patient=${patientUuid}&based-on=${serviceRequestUuid}`,
      role
    );
  }

  /**
   * Fetches the complete DiagnosticReport bundle (report + observations + encounter) by report UUID.
   * Calls the Bahmni `$fetch-bundle` operation defined in BahmniDiagnosticReportFhirR4Provider.
   * The path `{uuid}` is the DiagnosticReport's own UUID (returned by the search endpoint or the
   * $submit-bundle response).
   */
  async getDiagnosticReportBundle(
    reportUuid: string,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<FhirBundleResponse>> {
    return this.getFhir<FhirBundleResponse>(`${FHIR.diagnosticReport}/${reportUuid}/$fetch-bundle`, role);
  }

  async searchMedication(name: string, role: UserRole = 'admin'): Promise<ApiResponse<FhirBundleResponse>> {
    return this.getFhir<FhirBundleResponse>(
      `/openmrs/ws/fhir2/R4/Medication?name=${encodeURIComponent(name)}&_count=1`,
      role
    );
  }

  async submitConsultationBundle(
    bundle: Record<string, unknown>,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<FhirBundleResponse>> {
    return this.post<FhirBundleResponse>(FHIR.consultationBundle, bundle, role, 'application/fhir+json');
  }

  async submitConsultationBundleRaw(
    bundle: Record<string, unknown>,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<FhirBundleResponse>> {
    return this.postRaw<FhirBundleResponse>(FHIR.consultationBundle, bundle, role, 'application/fhir+json');
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

  // Generic raw GET for privilege/auth tests where the path is constructed by the caller.
  async fhirGetRaw(path: string, role: UserRole = 'admin'): Promise<ApiResponse<FhirBundleResponse>> {
    return this.getRawFhir<FhirBundleResponse>(path, role);
  }
}
