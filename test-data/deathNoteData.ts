export interface DeathNoteData {
  dateOfDeath: string;
  probableCause: string;
  broughtInDead: 'Yes' | 'No';
}

export const deathNoteFaker = {
  simpleDeathNote: (): DeathNoteData => ({
    dateOfDeath: '2026-03-10',
    probableCause: 'Natural Death',
    broughtInDead: 'No',
  }),
};
