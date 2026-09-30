import { faker } from '@faker-js/faker';
import { test, expect } from '../../../../src/api/fixtures/apiFixture';
import { getBundleEntriesByType } from '../../../../src/utils/fhir-bundle-utils';
import { buildDocumentReferencePayload } from '../../../../test-data/api/documentReferencePayload';
import { SMALL_PNG_BASE64, SMALL_PDF_BASE64 } from '../../../../test-data/api/testAttachments';
import {
  ConsultationContext,
  setupConsultationContext,
  teardownConsultationContext,
} from '../../../../src/api/helpers/consultationSetup';

interface DocumentReferenceEntry {
  resourceType: string;
  id: string;
  status: string;
  docStatus?: string;
  subject: { reference: string };
  masterIdentifier?: { value: string };
  author?: Array<{ reference: string }>;
  content: Array<{ attachment: { contentType: string; url: string } }>;
  meta?: { lastUpdated?: string };
}

test.describe.serial('POST + GET /fhir2/R4/DocumentReference — patient documents', { tag: ['@regression'] }, () => {
  let ctx: ConsultationContext;
  let singleMasterId: string;
  let doubleMasterId: string;

  test.beforeAll(async ({ api }) => {
    ctx = await setupConsultationContext(api);
    singleMasterId = `doc-single-${faker.string.alphanumeric(8)}`;
    doubleMasterId = `doc-double-${faker.string.alphanumeric(8)}`;
  });

  test('POST /fhir2/R4/DocumentReference — single attachment is registered for the patient', async ({ api }) => {
    const { body: upload } = await api.fhir.uploadDocument(ctx.patientUuid, SMALL_PNG_BASE64, 'single', 'image', 'png');
    expect(upload.url).toBeTruthy();

    const payload = buildDocumentReferencePayload({
      patientUuid: ctx.patientUuid,
      practitionerUuid: ctx.practitionerUuid,
      masterIdentifier: singleMasterId,
      attachments: [{ contentType: 'image/png', url: upload.url }],
    });
    const { status, body } = await api.fhir.createDocumentReference(payload);
    const docRef = body as unknown as DocumentReferenceEntry;

    expect(status).toBe(201);
    expect(docRef.resourceType).toBe('DocumentReference');
    expect(docRef.subject.reference).toContain(ctx.patientUuid);
    expect(docRef.masterIdentifier?.value).toBe(singleMasterId);
    expect(docRef.content.length).toBe(1);
    expect(docRef.content[0].attachment.url).toBe(upload.url);
    expect(docRef.author?.[0].reference).toContain(ctx.practitionerUuid);
  });

  test('POST /fhir2/R4/DocumentReference — multiple attachments registered as one DocumentReference', async ({
    api,
  }) => {
    const { body: png } = await api.fhir.uploadDocument(ctx.patientUuid, SMALL_PNG_BASE64, 'multi-png', 'image', 'png');
    const { body: pdf } = await api.fhir.uploadDocument(ctx.patientUuid, SMALL_PDF_BASE64, 'multi-pdf', 'pdf', 'pdf');

    const payload = buildDocumentReferencePayload({
      patientUuid: ctx.patientUuid,
      practitionerUuid: ctx.practitionerUuid,
      masterIdentifier: doubleMasterId,
      attachments: [
        { contentType: 'image/png', url: png.url },
        { contentType: 'application/pdf', url: pdf.url },
      ],
    });
    const { status, body } = await api.fhir.createDocumentReference(payload);
    const docRef = body as unknown as DocumentReferenceEntry;

    expect(status).toBe(201);
    expect(docRef.masterIdentifier?.value).toBe(doubleMasterId);
    expect(docRef.content.length).toBe(2);
    expect(docRef.content.map((c) => c.attachment.url)).toEqual(expect.arrayContaining([png.url, pdf.url]));
    expect(docRef.author?.[0].reference).toContain(ctx.practitionerUuid);
  });

  test('GET /fhir2/R4/DocumentReference?patient={uuid}&_sort=-_lastUpdated — both docs returned, sorted newest first, attachment counts and practitioner preserved', async ({
    api,
  }) => {
    const { status, body } = await api.fhir.getDocumentReferences(ctx.patientUuid, 5);
    const docRefs = getBundleEntriesByType<DocumentReferenceEntry>(body, 'DocumentReference');

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');
    expect(docRefs.length).toBeGreaterThanOrEqual(2);

    const single = docRefs.find((d) => d.masterIdentifier?.value === singleMasterId);
    const double = docRefs.find((d) => d.masterIdentifier?.value === doubleMasterId);

    expect(single).toBeDefined();
    expect(double).toBeDefined();
    expect(single?.masterIdentifier?.value).toBe(singleMasterId);
    expect(double?.masterIdentifier?.value).toBe(doubleMasterId);
    expect(single?.content.length).toBe(1);
    expect(double?.content.length).toBe(2);

    const timestamps = docRefs.map((d) => new Date(d.meta?.lastUpdated ?? 0).getTime());
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i - 1]).toBeGreaterThanOrEqual(timestamps[i]);
    }

    [single, double].forEach((d) => {
      expect(d?.subject.reference).toContain(ctx.patientUuid);
      expect(d?.author?.[0].reference).toContain(ctx.practitionerUuid);
    });
  });

  test.afterAll(async ({ api }) => {
    await teardownConsultationContext(api, ctx);
  });
});

test.describe('POST /bahmnicore/visitDocument/uploadDocument — validation', { tag: ['@regression'] }, () => {
  let ctx: ConsultationContext;

  test.beforeAll(async ({ api }) => {
    ctx = await setupConsultationContext(api);
  });

  test.afterAll(async ({ api }) => {
    await teardownConsultationContext(api, ctx);
  });

  test('rejects an upload for a non-existent patientUuid with 400', async ({ api }) => {
    const { status } = await api.fhir.uploadDocumentRaw(
      faker.string.uuid(),
      SMALL_PNG_BASE64,
      'orphan-doc',
      'image',
      'png'
    );

    expect(status).toBe(400);
  });

  test('rejects an unsupported file type with 400', async ({ api }) => {
    const { status, body } = await api.fhir.uploadDocumentRaw(
      ctx.patientUuid,
      SMALL_PNG_BASE64,
      'unsupported.exe',
      'application',
      'exe'
    );

    expect(status).toBe(400);
    expect(body.error?.message).toContain('file type is not supported');
  });

  // Confirmed against a live instance: the backend has no server-side size cap here —
  // bahmni.documentUpload.maxFileSizeInMB is a frontend-only pre-check (see the UI spec), and the
  // server's own limit is gated behind an unset DOCUMENT_MAX_SIZE_MB env var. A genuinely valid
  // image well over 5MB is accepted. What *is* rejected regardless of size is content the server
  // can't decode as an image, which is what a >5MB garbage-byte payload actually triggers below.
  test('rejects a >5MB payload that is not a decodable image with 400', async ({ api }) => {
    const oversizedGarbage = Buffer.alloc(6 * 1000 * 1000, 1).toString('base64');
    const { status, body } = await api.fhir.uploadDocumentRaw(
      ctx.patientUuid,
      oversizedGarbage,
      'oversized.png',
      'image',
      'png'
    );

    expect(status).toBe(400);
    expect(body.error?.message).toContain('not supported');
  });

  test('partial save: 2 invalid uploads fail independently while 1 valid upload still saves', async ({ api }) => {
    const oversizedGarbage = Buffer.alloc(6 * 1000 * 1000, 1).toString('base64');

    const validUpload = await api.fhir.uploadDocumentRaw(
      ctx.patientUuid,
      SMALL_PNG_BASE64,
      'valid.png',
      'image',
      'png'
    );
    const invalidTypeUpload = await api.fhir.uploadDocumentRaw(
      ctx.patientUuid,
      SMALL_PNG_BASE64,
      'invalid.exe',
      'application',
      'exe'
    );
    const invalidSizeUpload = await api.fhir.uploadDocumentRaw(
      ctx.patientUuid,
      oversizedGarbage,
      'oversized.png',
      'image',
      'png'
    );

    expect(validUpload.status).toBe(200);
    expect(validUpload.body.url).toBeTruthy();
    expect(invalidTypeUpload.status).toBe(400);
    expect(invalidSizeUpload.status).toBe(400);

    // Only the successful upload's url is bundled into the DocumentReference — mirroring the
    // Patient Documents widget, which saves each accepted file independently of the rejected ones.
    const payload = buildDocumentReferencePayload({
      patientUuid: ctx.patientUuid,
      practitionerUuid: ctx.practitionerUuid,
      masterIdentifier: `doc-partial-${faker.string.alphanumeric(8)}`,
      attachments: [{ contentType: 'image/png', url: validUpload.body.url as string }],
    });
    const { status, body } = await api.fhir.createDocumentReference(payload);
    const docRef = body as unknown as DocumentReferenceEntry;

    expect(status).toBe(201);
    expect(docRef.content).toHaveLength(1);
    expect(docRef.content[0].attachment.url).toBe(validUpload.body.url);
  });
});
