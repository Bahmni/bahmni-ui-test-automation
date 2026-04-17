export interface FhirBundle {
  resourceType: 'Bundle';
  type: string;
  entry: Array<{
    fullUrl: string;
    resource: Record<string, unknown>;
  }>;
}

export interface FhirBundleResponse {
  resourceType: 'Bundle';
  type: string;
  total?: number;
  entry?: Array<{
    resource: {
      resourceType: string;
      id: string;
      [key: string]: unknown;
    };
  }>;
}

export interface DiagnosticReportResponse {
  resourceType: 'DiagnosticReport';
  id: string;
  status: string;
  code: { text: string };
  result?: Array<{ reference: string }>;
}
