import { test, expect } from '../../../src/api/fixtures/apiFixture';
import { request } from '@playwright/test';
import { config } from '../../../src/config/env.config';
import { FHIR } from '../../../src/api/endpoints';
import { ApiFactory } from '../../../src/api/ApiFactory';
import { IDENTIFIER } from '../../../test-data/api/constants';
import { buildCreatePatientPayload } from '../../../test-data/api/patientPayload';
import {
  buildRelatedPersonPayload,
  daysFromNowIso,
  RELATED_PATIENT_EXT_URL,
  RELATIONSHIP_TYPE_SYSTEM,
} from '../../../test-data/api/relatedPersonPayload';
import { RelationshipType } from '../../../src/api/types/related-person.types';

const NON_EXISTENT_UUID = '00000000-0000-4000-8000-000000000000';

async function createPatient(api: ApiFactory): Promise<string> {
  const identifier = await api.patient.generateIdentifier(IDENTIFIER.sourceUuid);
  const { body } = await api.patient.create(buildCreatePatientPayload(identifier));
  return body.id;
}

function diagnostics(body: { issue?: Array<{ diagnostics?: string }> }): string {
  return body.issue?.[0]?.diagnostics ?? '';
}

test.describe.serial('FHIR RelatedPerson — patient-to-patient relationships', { tag: ['@regression'] }, () => {
  let patientA: string;
  let patientB: string;
  let typeOne: RelationshipType;
  let typeTwo: RelationshipType;
  const createdRelationships: string[] = [];

  test.beforeAll(async ({ api }) => {
    patientA = await createPatient(api);
    patientB = await createPatient(api);
    const { body } = await api.relatedPerson.getRelationshipTypes();
    if (body.results.length < 2) throw new Error('At least two relationship types are required on the server');
    [typeOne, typeTwo] = body.results;
  });

  test.afterEach(async ({ api }) => {
    // DELETE is idempotent (204 even for already-voided ids), so cleaning every tracked id is safe.
    for (const id of createdRelationships.splice(0)) {
      await api.relatedPerson.deleteRaw(id);
    }
  });

  test.afterAll(async ({ api }) => {
    for (const uuid of [patientA, patientB]) {
      if (uuid) await api.patient.delete(uuid);
    }
  });

  async function createRelationship(
    api: ApiFactory,
    overrides: { type?: RelationshipType; periodEnd?: string } = {}
  ): Promise<string> {
    const { status, body } = await api.relatedPerson.create(
      buildRelatedPersonPayload({
        patientUuid: patientA,
        relatedPatientUuid: patientB,
        relationshipTypeUuid: (overrides.type ?? typeOne).uuid,
        periodEnd: overrides.periodEnd,
      })
    );
    expect([200, 201]).toContain(status);
    createdRelationships.push(body.id);
    return body.id;
  }

  // ---------------------------------------------------------------- POST — success

  test('POST /RelatedPerson — valid payload returns 201 and the resource is retrievable', async ({ api }) => {
    const { status, body } = await api.relatedPerson.create(
      buildRelatedPersonPayload({
        patientUuid: patientA,
        relatedPatientUuid: patientB,
        relationshipTypeUuid: typeOne.uuid,
      })
    );
    createdRelationships.push(body.id);

    expect(status).toBe(201);
    expect(body.resourceType).toBe('RelatedPerson');
    expect(body.id).toBeTruthy();
    expect(body.patient.reference).toBe(`Patient/${patientA}`);
    expect(body.relationship?.[0].coding?.[0].code).toBe(typeOne.uuid);
    expect(body.extension?.find((e) => e.url === RELATED_PATIENT_EXT_URL)?.valueReference?.reference).toBe(
      `Patient/${patientB}`
    );

    const fetched = await api.relatedPerson.getByIdRaw(body.id);
    expect(fetched.status).toBe(200);
    expect(fetched.body.id).toBe(body.id);
  });

  test('POST /RelatedPerson — same patients with a different relationship type is allowed', async ({ api }) => {
    await createRelationship(api, { type: typeOne });
    const { status, body } = await api.relatedPerson.createRaw(
      buildRelatedPersonPayload({
        patientUuid: patientA,
        relatedPatientUuid: patientB,
        relationshipTypeUuid: typeTwo.uuid,
      })
    );
    if (body?.id) createdRelationships.push(body.id);
    expect(status).toBe(201);
  });

  test('POST /RelatedPerson — period.end in the future creates a time-bounded relationship', async ({ api }) => {
    const { status, body } = await api.relatedPerson.createRaw(
      buildRelatedPersonPayload({
        patientUuid: patientA,
        relatedPatientUuid: patientB,
        relationshipTypeUuid: typeOne.uuid,
        periodEnd: daysFromNowIso(30),
      })
    );
    if (body?.id) createdRelationships.push(body.id);
    expect(status).toBe(201);
    expect(body.period?.end).toBeTruthy();
  });

  test('POST /RelatedPerson — re-adding a relationship whose previous instance has expired is allowed', async ({
    api,
  }) => {
    await createRelationship(api, { type: typeOne, periodEnd: daysFromNowIso(-1) });
    const { status, body } = await api.relatedPerson.createRaw(
      buildRelatedPersonPayload({
        patientUuid: patientA,
        relatedPatientUuid: patientB,
        relationshipTypeUuid: typeOne.uuid,
      })
    );
    if (body?.id) createdRelationships.push(body.id);
    expect(status).toBe(201);
  });

  // ---------------------------------------------------------------- POST — 422

  test('POST /RelatedPerson — missing patient returns 422', async ({ api }) => {
    const payload = buildRelatedPersonPayload({
      patientUuid: patientA,
      relatedPatientUuid: patientB,
      relationshipTypeUuid: typeOne.uuid,
    });
    delete payload.patient;
    const { status, body } = await api.relatedPerson.createRaw(payload);
    expect(status).toBe(422);
    expect(diagnostics(body)).toContain('RelatedPerson.patient reference is required');
  });

  test('POST /RelatedPerson — non-existent patient UUID returns 422', async ({ api }) => {
    const { status, body } = await api.relatedPerson.createRaw(
      buildRelatedPersonPayload({
        patientUuid: NON_EXISTENT_UUID,
        relatedPatientUuid: patientB,
        relationshipTypeUuid: typeOne.uuid,
      })
    );
    expect(status).toBe(422);
    expect(diagnostics(body)).toContain(`Patient reference not found: Patient/${NON_EXISTENT_UUID}`);
  });

  test('POST /RelatedPerson — missing relatedPatient extension returns 422', async ({ api }) => {
    const payload = buildRelatedPersonPayload({
      patientUuid: patientA,
      relatedPatientUuid: patientB,
      relationshipTypeUuid: typeOne.uuid,
    });
    delete payload.extension;
    const { status, body } = await api.relatedPerson.createRaw(payload);
    expect(status).toBe(422);
    expect(diagnostics(body)).toContain('relatedPatient extension with a valid Patient reference is required');
  });

  test('POST /RelatedPerson — relatedPatient extension with an invalid UUID returns 422', async ({ api }) => {
    const payload = buildRelatedPersonPayload({
      patientUuid: patientA,
      relatedPatientUuid: 'not-a-valid-uuid',
      relationshipTypeUuid: typeOne.uuid,
    });
    const { status, body } = await api.relatedPerson.createRaw(payload);
    expect(status).toBe(422);
    expect(diagnostics(body)).toContain('relatedPatient extension with a valid Patient reference is required');
  });

  test('POST /RelatedPerson — missing relationship returns 422', async ({ api }) => {
    const payload = buildRelatedPersonPayload({
      patientUuid: patientA,
      relatedPatientUuid: patientB,
      relationshipTypeUuid: typeOne.uuid,
    });
    delete payload.relationship;
    const { status, body } = await api.relatedPerson.createRaw(payload);
    expect(status).toBe(422);
    expect(diagnostics(body)).toContain('RelatedPerson.relationship is required');
  });

  test('POST /RelatedPerson — invalid relationship type UUID returns 422', async ({ api }) => {
    const { status, body } = await api.relatedPerson.createRaw(
      buildRelatedPersonPayload({
        patientUuid: patientA,
        relatedPatientUuid: patientB,
        relationshipTypeUuid: 'not-a-valid-uuid',
      })
    );
    expect(status).toBe(422);
    expect(diagnostics(body)).toContain('relationship.coding must contain a valid relationship type code');
  });

  test('POST /RelatedPerson — duplicate active relationship of the same type returns 422', async ({ api }) => {
    await createRelationship(api, { type: typeOne });
    const { status, body } = await api.relatedPerson.createRaw(
      buildRelatedPersonPayload({
        patientUuid: patientA,
        relatedPatientUuid: patientB,
        relationshipTypeUuid: typeOne.uuid,
      })
    );
    if (body?.id) createdRelationships.push(body.id);
    expect(status).toBe(422);
    expect(diagnostics(body)).toContain('A relationship of this type between these patients already exists');
  });

  test('POST /RelatedPerson — duplicate where existing relationship ends in the future returns 422', async ({
    api,
  }) => {
    await createRelationship(api, { type: typeOne, periodEnd: daysFromNowIso(30) });
    const { status, body } = await api.relatedPerson.createRaw(
      buildRelatedPersonPayload({
        patientUuid: patientA,
        relatedPatientUuid: patientB,
        relationshipTypeUuid: typeOne.uuid,
      })
    );
    if (body?.id) createdRelationships.push(body.id);
    expect(status).toBe(422);
    expect(diagnostics(body)).toContain('A relationship of this type between these patients already exists');
  });

  test('POST /RelatedPerson — unauthenticated request returns 401', async () => {
    const ctx = await request.newContext({ ignoreHTTPSErrors: true });
    try {
      const response = await ctx.post(`${config.baseUrl}${FHIR.relatedPerson}`, {
        data: buildRelatedPersonPayload({
          patientUuid: patientA,
          relatedPatientUuid: patientB,
          relationshipTypeUuid: typeOne.uuid,
        }),
        headers: { 'Content-Type': 'application/fhir+json', Accept: 'application/fhir+json' },
      });
      expect(response.status()).toBe(401);
    } finally {
      await ctx.dispose();
    }
  });

  // ---------------------------------------------------------------- GET

  test('GET /RelatedPerson?patient=Patient/{uuid} — returns 200 with the patient relationships and mapped type', async ({
    api,
  }) => {
    const id = await createRelationship(api, { type: typeOne });
    const { status, body } = await api.relatedPerson.searchByPatientRaw(`Patient/${patientA}`);

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');
    const match = body.entry?.find((e) => e.resource.id === id)?.resource;
    expect(match).toBeTruthy();
    const coding = match?.relationship?.[0].coding?.[0];
    expect(coding?.system).toBe(RELATIONSHIP_TYPE_SYSTEM);
    expect(coding?.code).toBe(typeOne.uuid);
  });

  test('GET /RelatedPerson?patient={uuid} — bare UUID without Patient/ prefix returns 200 with results', async ({
    api,
  }) => {
    const id = await createRelationship(api);
    const { status, body } = await api.relatedPerson.searchByPatientRaw(patientA);
    expect(status).toBe(200);
    expect(body.entry?.some((e) => e.resource.id === id)).toBe(true);
  });

  test('GET /RelatedPerson?patient=Patient/{uuid} — patient with no relationships returns 200 and empty bundle', async ({
    api,
  }) => {
    const { status, body } = await api.relatedPerson.searchByPatientRaw(`Patient/${NON_EXISTENT_UUID}`);
    expect(status).toBe(200);
    expect(body.entry ?? []).toHaveLength(0);
  });

  test('GET /RelatedPerson?patient=invalid — invalid UUID returns 200 and empty bundle', async ({ api }) => {
    const { status, body } = await api.relatedPerson.searchByPatientRaw('not-a-valid-uuid');
    expect(status).toBe(200);
    expect(body.entry ?? []).toHaveLength(0);
  });

  test('GET /RelatedPerson — without patient query param returns 400', async ({ api }) => {
    const { status, body } = await api.relatedPerson.searchWithoutParamRaw();
    expect(status).toBe(400);
    expect(diagnostics(body)).toContain('patient reference is required to search RelatedPerson');
  });

  test('GET /RelatedPerson — unauthenticated request returns 401', async () => {
    const ctx = await request.newContext({ ignoreHTTPSErrors: true });
    try {
      const response = await ctx.get(`${config.baseUrl}${FHIR.relatedPerson}?patient=Patient/${patientA}`, {
        headers: { Accept: 'application/fhir+json' },
      });
      expect(response.status()).toBe(401);
    } finally {
      await ctx.dispose();
    }
  });

  // ---------------------------------------------------------------- PUT

  test('PUT /RelatedPerson/{id} — updating the relationship type returns 200', async ({ api }) => {
    const id = await createRelationship(api, { type: typeOne });
    const payload = {
      ...buildRelatedPersonPayload({
        patientUuid: patientA,
        relatedPatientUuid: patientB,
        relationshipTypeUuid: typeTwo.uuid,
      }),
      id,
    };
    const { status, body } = await api.relatedPerson.updateRaw(id, payload);

    expect(status).toBe(200);
    expect(body.id).toBe(id);
    expect(body.relationship?.[0].coding?.[0].code).toBe(typeTwo.uuid);
  });

  // ---------------------------------------------------------------- DELETE

  test('DELETE /RelatedPerson/{id} — returns 204 and relationship no longer appears in search', async ({ api }) => {
    const id = await createRelationship(api);
    const { status } = await api.relatedPerson.deleteRaw(id);
    expect(status).toBe(204);

    const { body } = await api.relatedPerson.searchByPatientRaw(`Patient/${patientA}`);
    expect(body.entry?.some((e) => e.resource.id === id) ?? false).toBe(false);
  });

  test('DELETE /RelatedPerson/{id} — non-existent UUID returns 204 (idempotent)', async ({ api }) => {
    const { status } = await api.relatedPerson.deleteRaw(NON_EXISTENT_UUID);
    expect(status).toBe(204);
  });

  test('DELETE /RelatedPerson/{id} — unauthenticated request returns 401', async ({ api }) => {
    const id = await createRelationship(api);
    const ctx = await request.newContext({ ignoreHTTPSErrors: true });
    try {
      const response = await ctx.delete(`${config.baseUrl}${FHIR.relatedPerson}/${id}`, {
        headers: { Accept: 'application/fhir+json' },
      });
      expect(response.status()).toBe(401);
    } finally {
      await ctx.dispose();
    }
  });
});
