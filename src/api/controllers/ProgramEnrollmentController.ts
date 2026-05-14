import { BaseApiController } from './BaseApiController';
import { REST } from '../endpoints';
import { ApiResponse, UserRole } from '../types/api.types';

export interface ProgramEnrollmentStateEntry {
  uuid: string;
  startDate: string;
  endDate?: string | null;
  voided?: boolean;
  state: {
    uuid: string;
    concept?: { uuid: string; display: string };
  };
}

export interface ProgramEnrollmentAttributeEntry {
  uuid: string;
  display?: string;
  attributeType?: { uuid: string; display: string };
  value?: string | { uuid: string; display: string };
  voided?: boolean;
}

export interface ProgramEnrollmentResponse {
  uuid: string;
  episodeUuid?: string;
  patient: { uuid: string; display?: string };
  program: { uuid: string; name?: string; display?: string };
  display?: string;
  dateEnrolled: string;
  dateCompleted?: string | null;
  location?: { uuid: string } | null;
  voided?: boolean;
  outcome?: { uuid: string } | null;
  states: ProgramEnrollmentStateEntry[];
  attributes: ProgramEnrollmentAttributeEntry[];
}

export interface ProgramEnrollmentListResponse {
  results: ProgramEnrollmentResponse[];
  totalCount?: number;
}

export class ProgramEnrollmentController extends BaseApiController {
  async enroll(
    payload: Record<string, unknown>,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<ProgramEnrollmentResponse>> {
    return this.post<ProgramEnrollmentResponse>(REST.bahmniProgramEnrollment, payload, role);
  }

  async getByPatientCustom(
    patientUuid: string,
    limit = 5,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<ProgramEnrollmentListResponse>> {
    const representation =
      'custom:(uuid,episodeUuid,patient,program,display,dateEnrolled,dateCompleted,location,voided,allowedStates,outcome,states:(uuid,startDate,endDate,voided,state:(uuid,concept:(uuid,display,name,names)),auditInfo),auditInfo,attributes)';
    return this.get<ProgramEnrollmentListResponse>(
      `${REST.bahmniProgramEnrollment}?patient=${patientUuid}&v=${encodeURIComponent(representation)}&limit=${limit}&startIndex=0&totalCount=true`,
      role
    );
  }

  async programExists(programUuid: string, role: UserRole = 'admin'): Promise<boolean> {
    const { status } = await this.getRaw<{ uuid?: string }>(`/openmrs/ws/rest/v1/program/${programUuid}`, role);
    return status === 200;
  }
}
