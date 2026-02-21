import { z } from 'zod';
import { INSPECTION_STATUSES, QUESTION_TYPES, SEVERITY_LEVELS } from '../types/inspection.types.js';

export const InspectionItemSchema = z.object({
  sectionId: z.string().min(1),
  questionId: z.string().min(1),
  answerType: z.enum(QUESTION_TYPES),
  answerBool: z.boolean().nullable().optional(),
  answerText: z.string().nullable().optional(),
  answerNumber: z.number().nullable().optional(),
  isCompliant: z.boolean().nullable().optional(),
  severity: z.enum(SEVERITY_LEVELS).nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type InspectionItemInput = z.infer<typeof InspectionItemSchema>;

export const CreateInspectionSchema = z.object({
  siteUuid: z.string().uuid(),
  templateVersionId: z.number().int().positive(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  notes: z.string().nullable().optional(),
  items: z.array(InspectionItemSchema).min(1),
});
export type CreateInspectionInput = z.infer<typeof CreateInspectionSchema>;

export const UpdateInspectionStatusSchema = z.object({
  status: z.enum(INSPECTION_STATUSES),
  reason: z.string().optional(),
});
export type UpdateInspectionStatusInput = z.infer<typeof UpdateInspectionStatusSchema>;
