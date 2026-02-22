import { z } from 'zod';
import { QUESTION_TYPES, SEVERITY_LEVELS } from '../types/inspection.types.js';

/**
 * Validates the JSONB structure of inspection templates.
 * Prevents malformed templates from crashing the mobile DynamicInspectionForm.
 */
export const TemplateQuestionSchema = z.object({
  id: z.string().min(1).max(50),
  text: z.string().min(1).max(500),
  type: z.enum(QUESTION_TYPES),
  required: z.boolean(),
  riskScore: z.number().int().min(1).max(10),
  defaultSeverity: z.enum(SEVERITY_LEVELS),
  options: z.array(z.string().min(1)).optional(),
  photoRequired: z.boolean().default(false),
  order: z.number().int().min(0),
});

export const TemplateSectionSchema = z.object({
  id: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  order: z.number().int().min(0),
  questions: z.array(TemplateQuestionSchema).min(1),
});

export const TemplateStructureSchema = z.object({
  sections: z.array(TemplateSectionSchema).min(1),
});
export type TemplateStructureInput = z.infer<typeof TemplateStructureSchema>;

export const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  category: z.string().max(100).nullable().optional(),
});
export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;

export const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>;

export const PublishTemplateVersionSchema = z.object({
  structure: TemplateStructureSchema,
  changeNotes: z.string().nullable().optional(),
});
export type PublishTemplateVersionInput = z.infer<typeof PublishTemplateVersionSchema>;
