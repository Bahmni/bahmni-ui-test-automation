export interface AppointmentTimeWindow {
  startDateTime: string;
  endDateTime: string;
}

export interface AppointmentOptions {
  patientUuid: string;
  serviceUuid: string;
  practitionerUuid: string;
  locationUuid?: string;
  window: AppointmentTimeWindow;
  comments?: string;
  status?: string;
  appointmentKind?: string;
}

export interface RecurringPattern {
  type: 'DAY' | 'WEEK';
  period: number;
  frequency: number;
}

export function buildAppointmentPayload(opts: AppointmentOptions): Record<string, unknown> {
  return {
    patientUuid: opts.patientUuid,
    serviceUuid: opts.serviceUuid,
    startDateTime: opts.window.startDateTime,
    endDateTime: opts.window.endDateTime,
    providers: [{ name: 'Provider', uuid: opts.practitionerUuid, response: 'ACCEPTED' }],
    locationUuid: opts.locationUuid ?? null,
    appointmentKind: opts.appointmentKind ?? 'Scheduled',
    comments: opts.comments ?? 'regular appointment',
    priority: null,
    status: opts.status ?? 'Scheduled',
  };
}

export function buildRecurringAppointmentPayload(
  opts: AppointmentOptions,
  recurringPattern: RecurringPattern
): Record<string, unknown> {
  return {
    appointmentRequest: {
      patientUuid: opts.patientUuid,
      serviceUuid: opts.serviceUuid,
      startDateTime: opts.window.startDateTime,
      endDateTime: opts.window.endDateTime,
      providers: [{ name: 'Provider', uuid: opts.practitionerUuid, response: 'ACCEPTED' }],
      locationUuid: opts.locationUuid ?? null,
      appointmentKind: opts.appointmentKind ?? 'Scheduled',
      comments: opts.comments ?? 'recurring appointment',
      priority: null,
      status: opts.status ?? null,
    },
    recurringPattern,
  };
}

export function futureAppointmentWindow(daysFromNow: number, durationMinutes = 30): AppointmentTimeWindow {
  const start = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  start.setUTCSeconds(0, 0);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return { startDateTime: start.toISOString(), endDateTime: end.toISOString() };
}
