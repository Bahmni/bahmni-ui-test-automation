import { CreateVisitRequest } from '../../src/api/types/visit.types';

export function buildStartVisitPayload(
  patientUuid: string,
  visitTypeUuid: string,
  locationUuid: string
): CreateVisitRequest {
  return {
    patient: patientUuid,
    visitType: visitTypeUuid,
    startDatetime: new Date().toISOString(),
    location: locationUuid,
  };
}
