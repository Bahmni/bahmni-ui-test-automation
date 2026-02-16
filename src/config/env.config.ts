import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables based on NODE_ENV
const env = process.env.NODE_ENV || 'dev';
const envFile = `.env.${env}`;

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

/**
 * Get required environment variable or throw error
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}. Please check your .env.${env} file.`);
  }
  return value;
}

/**
 * Get optional environment variable with default
 */
function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export const config = {
  // Base URL - Required
  baseUrl: getRequiredEnv('BASE_URL'),

  // Application URLs - Constructed from base URL or from env
  urls: {
    login: process.env.LOGIN_URL || `${getRequiredEnv('BASE_URL')}/bahmni/home/index.html#/login`,
    location: process.env.LOCATION_URL || `${getRequiredEnv('BASE_URL')}/bahmni/home/index.html#/loginLocation`,
    dashboard: process.env.DASHBOARD_URL || `${getRequiredEnv('BASE_URL')}/bahmni/home/index.html#/dashboard`,
    registrationSearch:
      process.env.REGISTRATION_SEARCH_URL || `${getRequiredEnv('BASE_URL')}/bahmni-new/registration/search`,
    registrationNewPatient:
      process.env.REGISTRATION_NEW_PATIENT_URL || `${getRequiredEnv('BASE_URL')}/bahmni-new/registration/patient/new`,
    clinicalSearch:
      process.env.CLINICAL_SEARCH_URL ||
      `${getRequiredEnv('BASE_URL')}/bahmni/clinical/index.html#/default/patient/search`,
  },

  // Credentials - Multiple Users (Required for security)
  users: {
    admin: {
      username: getRequiredEnv('USER_ADMIN_USERNAME'),
      password: getRequiredEnv('USER_ADMIN_PASSWORD'),
    },
    doctor: {
      username: getRequiredEnv('USER_DOCTOR_USERNAME'),
      password: getRequiredEnv('USER_DOCTOR_PASSWORD'),
    },
    nurse: {
      username: getRequiredEnv('USER_NURSE_USERNAME'),
      password: getRequiredEnv('USER_NURSE_PASSWORD'),
    },
    receptionist: {
      username: getRequiredEnv('USER_RECEPTIONIST_USERNAME'),
      password: getRequiredEnv('USER_RECEPTIONIST_PASSWORD'),
    },
  },

  // Default user
  defaultUser: getOptionalEnv('DEFAULT_USER', 'admin'),

  // Helper method to get user credentials by role
  getUser(role: 'admin' | 'doctor' | 'nurse' | 'receptionist' = 'admin') {
    return this.users[role];
  },

  // Default Settings
  defaults: {
    locale: getOptionalEnv('DEFAULT_LOCALE', 'string:en'),
    location: getOptionalEnv('DEFAULT_LOCATION', 'OPD-1'),
  },

  // Playwright Configuration
  playwright: {
    headless: process.env.HEADLESS === 'true',
    timeout: parseInt(getOptionalEnv('TIMEOUT', '30000')),
    slowMo: parseInt(getOptionalEnv('SLOW_MO', '100')),
    viewport: {
      width: parseInt(getOptionalEnv('VIEWPORT_WIDTH', '1920')),
      height: parseInt(getOptionalEnv('VIEWPORT_HEIGHT', '1080')),
    },
  },

  // Test Data
  testData: {
    phone: getOptionalEnv('DEFAULT_PATIENT_PHONE', '9876543210'),
    email: getOptionalEnv('DEFAULT_PATIENT_EMAIL', 'test@example.com'),
  },
};
