import { test, expect } from '../../../../src/api/fixtures/apiFixture';
import { getBundleEntriesByType } from '../../../../src/utils/fhir-bundle-utils';
import {
  buildAppointmentPayload,
  buildRecurringAppointmentPayload,
  futureAppointmentWindow,
} from '../../../../test-data/api/appointmentPayload';
import { APPOINTMENT_SERVICES } from '../../../../test-data/api/constants';
import {
  ConsultationContext,
  setupConsultationContext,
  teardownConsultationContext,
} from '../../../../src/api/helpers/consultationSetup';

interface FhirAppointmentEntry {
  resourceType: string;
  id: string;
  status: string;
  identifier?: Array<{ value: string }>;
  serviceType?: Array<{ coding: Array<{ code: string; display?: string }> }>;
  start: string;
  end: string;
  comment?: string;
  participant: Array<{
    actor: { reference: string; type: string; display?: string };
    status: string;
  }>;
}

function participantRef(
  entry: FhirAppointmentEntry,
  type: 'Patient' | 'Practitioner' | 'Location'
): string | undefined {
  return entry.participant.find((p) => p.actor.type === type)?.actor.reference;
}

test.describe.serial('POST /appointment + /recurring-appointments + GET /fhir2/R4/Appointment', { tag: ['@regression'] }, () => {
  let ctx: ConsultationContext;
  const regularWindow = futureAppointmentWindow(1, 30);
  const recurringWindow = futureAppointmentWindow(2, 30);
  const recurringPattern = { type: 'DAY' as const, period: 1, frequency: 3 };
  let regularUuid: string;
  let recurringBookingIdentifier: string | undefined;

  test.beforeAll(async ({ api }) => {
    ctx = await setupConsultationContext(api);
  });

  test('POST /appointment — single appointment is created with patient, service, provider, location, dates', async ({
    api,
  }) => {
    const payload = buildAppointmentPayload({
      patientUuid: ctx.patientUuid,
      serviceUuid: APPOINTMENT_SERVICES.primary,
      practitionerUuid: ctx.practitionerUuid,
      locationUuid: ctx.locationUuid,
      window: regularWindow,
      comments: 'regular',
    });
    const { status, body } = await api.appointment.create(payload);

    expect([200, 201]).toContain(status);
    expect(body.uuid).toBeTruthy();
    expect(body.status).toBe('Scheduled');
    expect(body.appointmentKind).toBe('Scheduled');
    expect(body.patient?.uuid).toBe(ctx.patientUuid);
    expect(body.service?.uuid).toBe(APPOINTMENT_SERVICES.primary);
    expect(body.providers?.[0].uuid).toBe(ctx.practitionerUuid);
    expect(body.location?.uuid).toBe(ctx.locationUuid);
    expect(new Date(body.startDateTime).toISOString()).toBe(regularWindow.startDateTime);
    expect(new Date(body.endDateTime).toISOString()).toBe(regularWindow.endDateTime);
    expect(body.comments).toBe('regular');

    regularUuid = body.uuid;
  });

  test('POST /recurring-appointments — recurring booking creates 3 daily instances sharing one identifier', async ({
    api,
  }) => {
    const payload = buildRecurringAppointmentPayload(
      {
        patientUuid: ctx.patientUuid,
        serviceUuid: APPOINTMENT_SERVICES.primary,
        practitionerUuid: ctx.practitionerUuid,
        locationUuid: ctx.locationUuid,
        window: recurringWindow,
        comments: 'recurring',
      },
      recurringPattern
    );
    const { status, body } = await api.appointment.createRecurring(payload);

    expect([200, 201]).toContain(status);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(recurringPattern.frequency);

    const appts = body.map((e) => e.appointmentDefaultResponse);

    appts.forEach((appt) => {
      expect(appt.uuid).toBeTruthy();
      expect(appt.patient?.uuid).toBe(ctx.patientUuid);
      expect(appt.service?.uuid).toBe(APPOINTMENT_SERVICES.primary);
      expect(appt.providers?.[0].uuid).toBe(ctx.practitionerUuid);
      expect(appt.status).toBe('Scheduled');
      expect(appt.recurring).toBe(true);
    });

    body.forEach((entry) => {
      expect(entry.recurringPattern.type).toBe(recurringPattern.type);
      expect(entry.recurringPattern.period).toBe(recurringPattern.period);
      expect(entry.recurringPattern.frequency).toBe(recurringPattern.frequency);
    });

    const starts = appts.map((a) => new Date(a.startDateTime).getTime()).sort((a, b) => a - b);
    for (let i = 1; i < starts.length; i++) {
      const diffDays = (starts[i] - starts[i - 1]) / (24 * 60 * 60 * 1000);
      expect(Math.round(diffDays)).toBe(recurringPattern.period);
    }

    recurringBookingIdentifier = appts[0].appointmentNumber;
  });

  test('GET /fhir2/R4/Appointment?patient={uuid}&date=geNOW — returns 1 regular + 3 recurring instances with service, dates, and practitioner', async ({
    api,
  }) => {
    const sinceIso = new Date(Date.now() - 60 * 1000).toISOString();
    const { status, body } = await api.fhir.getUpcomingAppointmentsForPatient(ctx.patientUuid, sinceIso, 10);
    const appointments = getBundleEntriesByType<FhirAppointmentEntry>(body, 'Appointment');

    expect(status).toBe(200);
    expect(body.resourceType).toBe('Bundle');
    expect(appointments.length).toBe(1 + recurringPattern.frequency);

    appointments.forEach((appt) => {
      expect(appt.status).toBe('booked');
      expect(participantRef(appt, 'Patient')).toContain(ctx.patientUuid);
      expect(participantRef(appt, 'Practitioner')).toContain(ctx.practitionerUuid);
      expect(appt.serviceType?.[0].coding[0].code).toBe(APPOINTMENT_SERVICES.primary);
    });

    const regular = appointments.find((a) => a.id === regularUuid);
    expect(regular).toBeDefined();
    expect(regular?.comment).toBe('regular');

    const recurringEntries = appointments.filter((a) => a.id !== regularUuid);
    expect(recurringEntries.length).toBe(recurringPattern.frequency);
    const recurringIdentifiers = new Set(recurringEntries.map((a) => a.identifier?.[0].value));
    expect(recurringIdentifiers.size).toBe(1);
    if (recurringBookingIdentifier) {
      expect([...recurringIdentifiers][0]).toBe(recurringBookingIdentifier);
    }
  });

  test.afterAll(async ({ api }) => {
    await teardownConsultationContext(api, ctx);
  });
});
