import { BaseApiController } from './BaseApiController';
import { REST } from '../endpoints';
import { ApiResponse, UserRole } from '../types/api.types';
import { LocationResponse } from '../types/visit.types';

export class LocationController extends BaseApiController {
  async getByName(name: string, role: UserRole = 'admin'): Promise<ApiResponse<LocationResponse>> {
    return this.get<LocationResponse>(`${REST.location}?q=${encodeURIComponent(name)}&v=default`, role);
  }
}
