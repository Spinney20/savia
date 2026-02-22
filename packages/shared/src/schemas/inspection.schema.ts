import { z } from 'zod';
import { QUESTION_TYPES, REVIEW_DECISIONS, SEVERITY_LEVELS } from '../types/inspection.types.js';

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
  templateUuid: z.string().uuid(),
  siteUuid: z.string().uuid(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  notes: z.string().nullable().optional(),
  items: z.array(InspectionItemSchema).optional(),
});
export type CreateInspectionInput = z.infer<typeof CreateInspectionSchema>;

export const UpdateInspectionDraftSchema = z.object({
  notes: z.string().nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  items: z.array(InspectionItemSchema).optional(),
});
export type UpdateInspectionDraftInput = z.infer<typeof UpdateInspectionDraftSchema>;

export const ReviewInspectionSchema = z
  .object({
    decision: z.enum(REVIEW_DECISIONS),
    reason: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.decision === 'REJECTED' || data.decision === 'NEEDS_REVISION') {
        return data.reason && data.reason.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Motivul este obligatoriu pentru respingere sau revizuire',
      path: ['reason'],
    },
  );
export type ReviewInspectionInput = z.infer<typeof ReviewInspectionSchema>;

export const UpdateInspectionStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'NEEDS_REVISION', 'CLOSED'] as const),
  reason: z.string().optional(),
});
export type UpdateInspectionStatusInput = z.infer<typeof UpdateInspectionStatusSchema>;
