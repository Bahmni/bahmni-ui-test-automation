export interface RelationshipType {
  uuid: string;
  aIsToB: string;
  bIsToA: string;
}

export interface RelatedPersonResource {
  resourceType: 'RelatedPerson';
  id: string;
  active?: boolean;
  patient: { reference: string };
  relationship?: Array<{ coding?: Array<{ system?: string; code?: string; display?: string }>; text?: string }>;
  extension?: Array<{ url: string; valueReference?: { reference: string } }>;
  period?: { start?: string; end?: string };
}

export interface RelatedPersonSearchBundle {
  resourceType: 'Bundle';
  total?: number;
  entry?: Array<{ resource: RelatedPersonResource }>;
}
