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

test.describe.serial('POST + GET /fhir2/R4/DocumentReference — patient documents', () => {
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
