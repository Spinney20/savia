/**
 * Training types — conform Legii 319/2006 și HG 1425/2006
 */

export const TRAINING_TYPES = [
  'ANGAJARE',
  'PERIODIC',
  'SCHIMBARE_LOC_MUNCA',
  'REVENIRE_MEDICAL',
  'SPECIAL',
  'ZILNIC',
] as const;
export type TrainingType = (typeof TRAINING_TYPES)[number];

export const CONFIRMATION_METHODS = [
  'PENDING',
  'MANUAL',
  'SELF_CONFIRMED',
  'ABSENT',
] as const;
export type ConfirmationMethod = (typeof CONFIRMATION_METHODS)[number];

export interface TrainingDto {
  uuid: string;
  siteUuid: string;
  conductorName: string;
  trainingType: TrainingType;
  title: string;
  description: string | null;
  conductedAt: string;
  durationMinutes: number | null;
  participantCount: number;
  createdAt: string;
}

export interface TrainingParticipantDto {
  employeeUuid: string;
  employeeName: string;
  confirmationMethod: ConfirmationMethod;
  confirmedAt: string | null;
  notes: string | null;
}
