export interface AppointmentDates {
  startDateTime: string;
  endDateTime: string;
}

export function generateUpcomingAppointmentDates(dayOffset: number = 2, hour: number = 10): AppointmentDates {
  const start = new Date();
  start.setDate(start.getDate() + dayOffset);
  start.setHours(hour, 0, 0, 0);

  const end = new Date(start);
  end.setMinutes(30);

  return {
    startDateTime: start.toISOString(),
    endDateTime: end.toISOString(),
  };
}

export function generatePastAppointmentDates(dayOffset: number = 5, hour: number = 10): AppointmentDates {
  const start = new Date();
  start.setDate(start.getDate() - dayOffset);
  start.setHours(hour, 0, 0, 0);

  const end = new Date(start);
  end.setMinutes(30);

  return {
    startDateTime: start.toISOString(),
    endDateTime: end.toISOString(),
  };
}
