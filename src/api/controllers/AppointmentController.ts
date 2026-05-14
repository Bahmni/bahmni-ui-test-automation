import { BaseApiController } from './BaseApiController';
import { REST } from '../endpoints';
import { ApiResponse, UserRole } from '../types/api.types';

export interface AppointmentResponse {
  uuid: string;
  appointmentNumber?: string;
  patient?: { uuid: string };
  service?: { uuid: string; name?: string };
  serviceType?: { uuid: string; name?: string } | null;
  providers?: Array<{ uuid: string; name?: string; response?: string }>;
  location?: { uuid: string; name?: string } | null;
  startDateTime: string | number;
  endDateTime: string | number;
  appointmentKind: string;
  status: string;
  comments?: string;
  recurring?: boolean;
}

export interface RecurringPatternResponse {
  type: string;
  period: number;
  frequency: number;
  endDate?: string | number | null;
  daysOfWeek?: string[] | null;
}

export interface RecurringAppointmentResponseEntry {
  appointmentDefaultResponse: AppointmentResponse;
  recurringPattern: RecurringPatternResponse;
}

export class AppointmentController extends BaseApiController {
  async create(payload: Record<string, unknown>, role: UserRole = 'admin'): Promise<ApiResponse<AppointmentResponse>> {
    return this.post<AppointmentResponse>(REST.appointment, payload, role);
  }

  async createRecurring(
    payload: Record<string, unknown>,
    role: UserRole = 'admin'
  ): Promise<ApiResponse<RecurringAppointmentResponseEntry[]>> {
    return this.post<RecurringAppointmentResponseEntry[]>(REST.recurringAppointments, payload, role);
  }

  async getAllServices(role: UserRole = 'admin'): Promise<ApiResponse<Array<{ uuid: string; name: string }>>> {
    return this.get<Array<{ uuid: string; name: string }>>(`${REST.appointmentService}/all/full`, role);
  }
}
