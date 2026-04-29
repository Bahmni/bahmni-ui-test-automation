import { FhirBundleResponse } from '../api/types/fhir.types';

export function getBundleEntriesByType<T = Record<string, unknown>>(
  bundle: FhirBundleResponse,
  resourceType: string
): T[] {
  if (!bundle.entry || bundle.entry.length === 0) return [];
  return bundle.entry.filter((e) => e.resource.resourceType === resourceType).map((e) => e.resource as unknown as T);
}

export function getBundleTotal(bundle: FhirBundleResponse): number {
  return bundle.total ?? bundle.entry?.length ?? 0;
}

export function assertReferenceContains(reference: string, uuid: string): boolean {
  return reference.includes(uuid);
}
