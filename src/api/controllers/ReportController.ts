import { BaseApiController } from './BaseApiController';
import { REPORTS, REST } from '../endpoints';
import { ApiResponse, UserRole } from '../types/api.types';

export interface ReportParams {
  name: string;
  startDate: string;
  endDate: string;
  responseType?: string;
  paperSize?: string;
  appName?: string;
}

export class ReportController extends BaseApiController {
  private async sessionCookie(role: UserRole): Promise<string> {
    await this.request.get(`${this.baseUrl}${REST.session}`, { headers: this.authHeaders(role) });
    const state = await this.request.storageState();
    const jsessionId = state.cookies.find((c) => c.name === 'JSESSIONID')?.value ?? '';
    if (!jsessionId) throw new Error('Could not obtain JSESSIONID from OpenMRS session');
    return `JSESSIONID=${jsessionId}; reporting_session=${jsessionId}`;
  }

  async generate(params: ReportParams, role: UserRole = 'admin'): Promise<ApiResponse<string>> {
    const cookie = await this.sessionCookie(role);
    const query = new URLSearchParams({
      name: params.name,
      startDate: params.startDate,
      endDate: params.endDate,
      responseType: params.responseType ?? 'text/html',
      paperSize: params.paperSize ?? 'A4',
      appName: params.appName ?? 'reports',
    });
    const response = await this.request.get(`${this.baseUrl}${REPORTS.report}?${query}`, {
      headers: { ...this.authHeaders(role), Cookie: cookie },
    });
    if (!response.ok()) {
      throw new Error(
        `GET ${REPORTS.report} for "${params.name}" failed: ${response.status()} ${await response.text()}`
      );
    }
    return { status: response.status(), body: await response.text() };
  }
}
