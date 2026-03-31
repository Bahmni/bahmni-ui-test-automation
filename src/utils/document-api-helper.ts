import { APIRequestContext } from '@playwright/test';
import { config } from '../config/env.config';
import * as fs from 'fs';
import * as path from 'path';

interface DocumentUpload {
  fileName: string;
  filePath: string;
  fileType: string;
  format: string;
  contentType: string;
}

export class DocumentApiHelper {
  private readonly restBaseUrl: string;
  private readonly fhirBaseUrl: string;

  constructor(private readonly request: APIRequestContext) {
    this.restBaseUrl = `${config.baseUrl}/openmrs/ws/rest/v1`;
    this.fhirBaseUrl = `${config.baseUrl}/openmrs/ws/fhir2/R4`;
  }

  async uploadDocument(
    patientUuid: string,
    fileName: string,
    filePath: string,
    fileType: string,
    format: string
  ): Promise<string> {
    const absolutePath = path.resolve(filePath);
    const fileContent = fs.readFileSync(absolutePath);
    const base64Content = fileContent.toString('base64');

    const response = await this.request.post(`${this.restBaseUrl}/bahmnicore/visitDocument/uploadDocument`, {
      data: {
        content: base64Content,
        encounterTypeName: 'Patient Document',
        fileName,
        fileType,
        format,
        patientUuid,
      },
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
    });

    if (!response.ok()) {
      throw new Error(`Failed to upload document: ${response.status()} ${await response.text()}`);
    }

    const data = await response.json();
    return data.url;
  }

  async createDocumentReference(
    patientUuid: string,
    contentEntries: { contentType: string; url: string }[]
  ): Promise<void> {
    const response = await this.request.post(`${this.fhirBaseUrl}/DocumentReference`, {
      data: {
        resourceType: 'DocumentReference',
        status: 'current',
        docStatus: 'final',
        subject: {
          reference: `Patient/${patientUuid}`,
        },
        masterIdentifier: {
          value: 'patientImageAndHistory',
        },
        type: {
          coding: [
            {
              code: '94ea9aba-a82c-4e54-9c11-722d97ae54b8',
              display: 'PatientFile',
            },
          ],
        },
        date: new Date().toISOString(),
        content: contentEntries.map((entry) => ({
          attachment: {
            contentType: entry.contentType,
            url: entry.url,
          },
        })),
      },
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
    });

    if (!response.ok()) {
      throw new Error(`Failed to create DocumentReference: ${response.status()} ${await response.text()}`);
    }
  }

  async uploadAndRegisterDocuments(patientUuid: string, documents: DocumentUpload[]): Promise<void> {
    const contentEntries: { contentType: string; url: string }[] = [];

    for (const doc of documents) {
      const url = await this.uploadDocument(patientUuid, doc.fileName, doc.filePath, doc.fileType, doc.format);
      contentEntries.push({ contentType: doc.contentType, url });
    }

    await this.createDocumentReference(patientUuid, contentEntries);
  }

  private getAuthHeaders() {
    const { username, password } = config.users.admin;
    const encoded = Buffer.from(`${username}:${password}`).toString('base64');
    return { Authorization: `Basic ${encoded}` };
  }
}
