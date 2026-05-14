import { DOCUMENT_TYPES } from './constants';

export interface DocumentAttachment {
  contentType: string;
  url: string;
}

export interface DocumentReferenceOptions {
  patientUuid: string;
  practitionerUuid: string;
  masterIdentifier: string;
  attachments: DocumentAttachment[];
  date?: string;
}

export function buildDocumentReferencePayload(opts: DocumentReferenceOptions): Record<string, unknown> {
  return {
    resourceType: 'DocumentReference',
    status: 'current',
    docStatus: 'final',
    subject: { reference: `Patient/${opts.patientUuid}` },
    masterIdentifier: { value: opts.masterIdentifier },
    type: { coding: [{ code: DOCUMENT_TYPES.patientFile, display: 'Patient File' }] },
    author: [{ reference: `Practitioner/${opts.practitionerUuid}` }],
    date: opts.date ?? new Date().toISOString(),
    content: opts.attachments.map((a) => ({ attachment: { contentType: a.contentType, url: a.url } })),
  };
}
