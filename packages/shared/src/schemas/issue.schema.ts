import { z } from 'zod';
import { SEVERITY_LEVELS } from '../types/inspection.types.js';
import { ISSUE_STATUSES } from '../types/issue.types.js';

export const CreateIssueSchema = z.object({
  siteUuid: z.string().uuid(),
  categoryUuid: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  severity: z.enum(SEVERITY_LEVELS).default('MEDIUM'),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});
export type CreateIssueInput = z.infer<typeof CreateIssueSchema>;

export const UpdateIssueStatusSchema = z.object({
  status: z.enum(ISSUE_STATUSES),
  reason: z.string().optional(),
});
export type UpdateIssueStatusInput = z.infer<typeof UpdateIssueStatusSchema>;

export const AssignIssueSchema = z.object({
  assignedToUuid: z.string().uuid(),
  deadline: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type AssignIssueInput = z.infer<typeof AssignIssueSchema>;

export const CreateIssueCommentSchema = z.object({
  content: z.string().min(1),
});
export type CreateIssueCommentInput = z.infer<typeof CreateIssueCommentSchema>;
