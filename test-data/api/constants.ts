export const IDENTIFIER = {
  sourceUuid: process.env.IDENTIFIER_SOURCE_UUID || 'c5cf4b68-6529-43fc-a644-c775ae73745e',
  typeUuid: process.env.IDENTIFIER_TYPE_UUID || 'd3153eb0-5e07-11ef-8f7c-0242ac120002',
  prefix: process.env.IDENTIFIER_PREFIX || 'ABC',
} as const;

export const PERSON_ATTRIBUTE_TYPE = {
  phoneNumber: 'a384873b-847a-4a86-b869-28fb601162dd',
  alternatePhoneNumber: '27fa84ff-fdd6-4895-9c77-254b60555f39',
  email: 'e3123cba-5e07-11ef-8f7c-0242ac120002',
} as const;

export const VISIT_TYPES = {
  opd: 'OPD',
} as const;

export const LOCATIONS = {
  opd1: 'OPD-1',
  loginLocationUuid: '5e232c47-8ff5-4c5c-8057-7e39a64fefa5',
} as const;
