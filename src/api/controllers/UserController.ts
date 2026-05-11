import { BaseApiController } from './BaseApiController';
import { REST } from '../endpoints';
import { ApiResponse, UserRole } from '../types/api.types';

interface SessionResponse {
  authenticated: boolean;
  user: { uuid: string; display: string };
}

interface ProviderResponse {
  results: Array<{ uuid: string; display: string }>;
}

export class UserController extends BaseApiController {
  async getSession(role: UserRole = 'admin'): Promise<ApiResponse<SessionResponse>> {
    return this.get<SessionResponse>(REST.session, role);
  }

  async getProviderByUser(userUuid: string, role: UserRole = 'admin'): Promise<ApiResponse<ProviderResponse>> {
    return this.get<ProviderResponse>(`${REST.provider}?user=${userUuid}&v=custom:(uuid,display)`, role);
  }
}
