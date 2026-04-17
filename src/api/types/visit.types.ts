export interface CreateVisitRequest {
  patient: string;
  visitType: string;
  startDatetime: string;
  location: string;
}

export interface VisitResponse {
  uuid: string;
  display: string;
  patient: { uuid: string; display: string };
  visitType: { uuid: string; display: string };
  startDatetime: string;
  stopDatetime: string | null;
  location: { uuid: string; display: string };
}

export interface VisitTypeResponse {
  results: Array<{
    uuid: string;
    display: string;
  }>;
}

export interface LocationResponse {
  results: Array<{
    uuid: string;
    display: string;
    name: string;
  }>;
}
