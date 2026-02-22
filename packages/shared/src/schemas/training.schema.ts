import { z } from 'zod';
import { TRAINING_TYPES, CONFIRMATION_METHODS } from '../types/training.types.js';

export const CreateTrainingSchema = z.object({
  siteUuid: z.string().uuid(),
  trainingType: z.enum(TRAINING_TYPES),
  title: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  conductedAt: z.string().datetime(),
  durationMinutes: z.number().int().positive().nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  participantEmployeeUuids: z.array(z.string().uuid()).min(1),
});
export type CreateTrainingInput = z.infer<typeof CreateTrainingSchema>;

export const ConfirmParticipationSchema = z.object({
  confirmationMethod: z.enum(CONFIRMATION_METHODS),
  notes: z.string().nullable().optional(),
});
export type ConfirmParticipationInput = z.infer<typeof ConfirmParticipationSchema>;

export const UpdateParticipantsSchema = z.object({
  participants: z.array(z.object({
    employeeUuid: z.string().uuid(),
    confirmationMethod: z.enum(['MANUAL', 'ABSENT'] as const),
    notes: z.string().nullable().optional(),
  })).min(1),
});
export type UpdateParticipantsInput = z.infer<typeof UpdateParticipantsSchema>;
