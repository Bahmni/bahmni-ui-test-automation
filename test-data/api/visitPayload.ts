import { CreateVisitRequest } from '../../src/api/types/visit.types';

export function buildStartVisitPayload(
  patientUuid: string,
  visitTypeUuid: string,
  locationUuid: string
): CreateVisitRequest {
  return {
    patient: patientUuid,
    visitType: visitTypeUuid,
    startDatetime: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    location: locationUuid,
  };
}
