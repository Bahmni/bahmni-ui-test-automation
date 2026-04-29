import { APIRequestContext, APIResponse } from '@playwright/test';
import { config } from '../../config/env.config';
import { ApiResponse, UserRole } from '../types/api.types';

export abstract class BaseApiController {
  protected readonly baseUrl: string;

  constructor(protected readonly request: APIRequestContext) {
    this.baseUrl = config.baseUrl;
  }

  protected authHeaders(role: UserRole = 'admin'): Record<string, string> {
    const { username, password } = config.users[role];
    const encoded = Buffer.from(`${username}:${password}`).toString('base64');
    return { Authorization: `Basic ${encoded}` };
  }

  // --- Happy-path methods: throw on non-OK status ---

  protected async get<T>(path: string, role: UserRole = 'admin'): Promise<ApiResponse<T>> {
    const response = await this.request.get(`${this.baseUrl}${path}`, {
      headers: this.authHeaders(role),
    });
    return this.parseOrThrow<T>(response, 'GET', path);
  }

  protected async getFhir<T>(path: string, role: UserRole = 'admin'): Promise<ApiResponse<T>> {
    const response = await this.request.get(`${this.baseUrl}${path}`, {
      headers: { ...this.authHeaders(role), Accept: 'application/fhir+json' },
    });
    return this.parseOrThrow<T>(response, 'GET', path);
  }

  protected async getRawFhir<T>(path: string, role: UserRole = 'admin'): Promise<ApiResponse<T>> {
    const response = await this.request.get(`${this.baseUrl}${path}`, {
      headers: { ...this.authHeaders(role), Accept: 'application/fhir+json' },
    });
    return this.parseRaw<T>(response);
  }

  protected async post<T>(
    path: string,
    body: unknown,
    role: UserRole = 'admin',
    contentType = 'application/json'
  ): Promise<ApiResponse<T>> {
    const response = await this.request.post(`${this.baseUrl}${path}`, {
      data: body,
      headers: { ...this.authHeaders(role), 'Content-Type': contentType },
    });
    return this.parseOrThrow<T>(response, 'POST', path);
  }

  protected async put<T>(path: string, body: unknown, role: UserRole = 'admin'): Promise<ApiResponse<T>> {
    const response = await this.request.put(`${this.baseUrl}${path}`, {
      data: body,
      headers: { ...this.authHeaders(role), 'Content-Type': 'application/json' },
    });
    return this.parseOrThrow<T>(response, 'PUT', path);
  }

  protected async del(path: string, role: UserRole = 'admin'): Promise<ApiResponse<void>> {
    const response = await this.request.delete(`${this.baseUrl}${path}`, {
      headers: this.authHeaders(role),
    });
    if (!response.ok()) {
      throw new Error(`DELETE ${path} failed: ${response.status()} ${await response.text()}`);
    }
    return { status: response.status(), body: undefined as void };
  }

  // --- Raw methods: never throw, return status + body for negative tests ---

  protected async getRaw<T>(path: string, role: UserRole = 'admin'): Promise<ApiResponse<T>> {
    const response = await this.request.get(`${this.baseUrl}${path}`, {
      headers: this.authHeaders(role),
    });
    return this.parseRaw<T>(response);
  }

  protected async postRaw<T>(
    path: string,
    body: unknown,
    role: UserRole = 'admin',
    contentType = 'application/json'
  ): Promise<ApiResponse<T>> {
    const response = await this.request.post(`${this.baseUrl}${path}`, {
      data: body,
      headers: { ...this.authHeaders(role), 'Content-Type': contentType },
    });
    return this.parseRaw<T>(response);
  }

  protected async putRaw<T>(path: string, body: unknown, role: UserRole = 'admin'): Promise<ApiResponse<T>> {
    const response = await this.request.put(`${this.baseUrl}${path}`, {
      data: body,
      headers: { ...this.authHeaders(role), 'Content-Type': 'application/json' },
    });
    return this.parseRaw<T>(response);
  }

  protected async delRaw(path: string, role: UserRole = 'admin'): Promise<ApiResponse<void>> {
    const response = await this.request.delete(`${this.baseUrl}${path}`, {
      headers: this.authHeaders(role),
    });
    return { status: response.status(), body: undefined as void };
  }

  private async parseOrThrow<T>(response: APIResponse, method: string, path: string): Promise<ApiResponse<T>> {
    if (!response.ok()) {
      throw new Error(`${method} ${path} failed: ${response.status()} ${await response.text()}`);
    }
    return { status: response.status(), body: (await response.json()) as T };
  }

  private async parseRaw<T>(response: APIResponse): Promise<ApiResponse<T>> {
    let body: T;
    try {
      body = (await response.json()) as T;
    } catch {
      body = undefined as T;
    }
    return { status: response.status(), body };
  }
}
