import { APIRequestContext } from '@playwright/test';
import { config } from '../config/env.config';
import { AppointmentDates } from '../../test-data/appointmentData';

interface CreateAppointmentParams {
  patientUuid: string;
  serviceUuid: string;
  dates: AppointmentDates;
  status: string;
  locationUuid: string;
}

export class AppointmentApiHelper {
  private readonly baseUrl: string;

  constructor(private readonly request: APIRequestContext) {
    this.baseUrl = config.baseUrl;
  }

  async getFirstAvailableServiceUuid(): Promise<string> {
    const response = await this.request.get(
      `${this.baseUrl}/openmrs/ws/rest/v1/appointmentService/all/full`,
      { headers: this.getAuthHeaders() }
    );

    if (!response.ok()) {
      throw new Error(`Failed to fetch appointment services: ${response.status()} ${await response.text()}`);
    }

    const services = await response.json();
    if (!services || services.length === 0) {
      throw new Error('No appointment services found');
    }
    return services[0].uuid;
  }

  async getLocationUuid(locationName: string): Promise<string> {
    const response = await this.request.get(
      `${this.baseUrl}/openmrs/ws/rest/v1/location?q=${encodeURIComponent(locationName)}&v=default`,
      { headers: this.getAuthHeaders() }
    );

    if (!response.ok()) {
      throw new Error(`Failed to fetch location: ${response.status()} ${await response.text()}`);
    }

    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      throw new Error(`Location not found: ${locationName}`);
    }
    return data.results[0].uuid;
  }

  async createAppointment(params: CreateAppointmentParams): Promise<void> {
    const response = await this.request.post(
      `${this.baseUrl}/openmrs/ws/rest/v1/appointments`,
      {
        data: {
          patientUuid: params.patientUuid,
          serviceUuid: params.serviceUuid,
          startDateTime: params.dates.startDateTime,
          endDateTime: params.dates.endDateTime,
          appointmentKind: 'Scheduled',
          status: params.status,
          locationUuid: params.locationUuid,
          providers: [],
        },
        headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok()) {
      throw new Error(`Failed to create appointment: ${response.status()} ${await response.text()}`);
    }
  }

  private getAuthHeaders() {
    const { username, password } = config.users.admin;
    const encoded = Buffer.from(`${username}:${password}`).toString('base64');
    return { Authorization: `Basic ${encoded}` };
  }
}
