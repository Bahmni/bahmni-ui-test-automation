export interface ApiResponse<T> {
  status: number;
  body: T;
}

export type UserRole = 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'frontdesk' | 'clinicalRead';
