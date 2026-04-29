import { ApiFactory } from '../ApiFactory';
import { buildCreatePatientPayload } from '../../../test-data/api/patientPayload';
import { buildStartVisitPayload } from '../../../test-data/api/visitPayload';
import { LOCATIONS, VISIT_TYPES } from '../../../test-data/api/constants';
import { getBundleEntriesByType } from '../../utils/fhir-bundle-utils';
import { BundleContext } from '../types/fhir-resources.types';

export interface ConsultationContext extends BundleContext {
  visitUuid: string;
}

export async function setupConsultationContext(api: ApiFactory): Promise<ConsultationContext> {
  const { body: patientBody } = await api.patient.create(buildCreatePatientPayload());
  const patientUuid = patientBody.patient.uuid;

  const { body: locationBody } = await api.location.getByName(LOCATIONS.opd1);
  const locationUuid = locationBody.results[0].uuid;

  const { body: visitTypeBody } = await api.visit.getVisitTypes();
  const opdType = visitTypeBody.results.find((vt) => vt.display.includes(VISIT_TYPES.opd));
  if (!opdType) throw new Error('OPD visit type not found — check visit type configuration in OpenMRS');
  const { body: visitBody } = await api.visit.create(buildStartVisitPayload(patientUuid, opdType.uuid, locationUuid));
  const visitUuid = visitBody.uuid;

  const { body: visitEncounterBundle } = await api.fhir.getVisitEncounters(patientUuid);
  const visitEncounters = getBundleEntriesByType<{ id: string }>(visitEncounterBundle, 'Encounter');
  if (!visitEncounters.length)
    throw new Error('No visit encounter found after creating visit — visit may not have been persisted');
  const visitEncounterUuid = visitEncounters[0].id;

  const { body: sessionBody } = await api.user.getSession();
  const { body: providerBody } = await api.user.getProviderByUser(sessionBody.user.uuid);
  if (!providerBody.results.length) {
    throw new Error(
      `No provider found for user ${sessionBody.user.uuid} — admin user must have an associated provider record`
    );
  }
  const practitionerUuid = providerBody.results[0].uuid;

  return { patientUuid, visitUuid, visitEncounterUuid, practitionerUuid, locationUuid };
}

export async function teardownConsultationContext(api: ApiFactory, ctx: ConsultationContext): Promise<void> {
  if (ctx.visitUuid) await api.visit.end(ctx.visitUuid).catch(() => {});
  if (ctx.patientUuid) await api.patient.delete(ctx.patientUuid).catch(() => {});
}

/**
 * Returns the id of the first resource of the given type in a ConsultationBundle response.
 * ConsultationBundle responses always contain exactly one Encounter, so this is safe for that case.
 * For resource types where multiple may exist (e.g., ServiceRequest), use `getBundleEntriesByType` directly.
 */
export function extractFirstUuidFromBundle(
  bundleResponse: { entry?: Array<{ resource: { resourceType: string; id: string } }> },
  resourceType: string
): string {
  const entry = bundleResponse.entry?.find((e) => e.resource.resourceType === resourceType);
  if (!entry) throw new Error(`No ${resourceType} found in ConsultationBundle response`);
  return entry.resource.id;
}
