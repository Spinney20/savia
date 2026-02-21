/**
 * Inspection types — templates, inspections, items, reviews
 */

export const INSPECTION_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'NEEDS_REVISION',
  'CLOSED',
] as const;
export type InspectionStatus = (typeof INSPECTION_STATUSES)[number];

export const QUESTION_TYPES = ['YES_NO', 'TEXT', 'NUMBER', 'SELECT', 'PHOTO'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const SEVERITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type Severity = (typeof SEVERITY_LEVELS)[number];

export const REVIEW_DECISIONS = ['APPROVED', 'REJECTED', 'NEEDS_REVISION'] as const;
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

/** Template question definition (inside JSONB structure) */
export interface TemplateQuestion {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  riskScore: number; // 1-10
  defaultSeverity: Severity;
  options?: string[]; // only for type=SELECT
  photoRequired: boolean;
  order: number;
}

/** Template section (inside JSONB structure) */
export interface TemplateSection {
  id: string;
  title: string;
  order: number;
  questions: TemplateQuestion[];
}

/** Full template structure (the JSONB value) */
export interface TemplateStructure {
  sections: TemplateSection[];
}

export interface InspectionTemplateDto {
  uuid: string;
  name: string;
  description: string | null;
  category: string | null;
  isActive: boolean;
  versionCount: number;
  currentVersionNumber: number | null;
  createdAt: string;
}

export interface InspectionDto {
  uuid: string;
  siteUuid: string;
  templateName: string;
  inspectorName: string;
  status: InspectionStatus;
  riskScore: number | null;
  totalItems: number;
  compliantItems: number;
  nonCompliantItems: number;
  startedAt: string | null;
  completedAt: string | null;
  submittedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface InspectionItemDto {
  sectionId: string;
  questionId: string;
  answerType: QuestionType;
  answerBool: boolean | null;
  answerText: string | null;
  answerNumber: number | null;
  isCompliant: boolean | null;
  severity: Severity | null;
  riskScore: number | null;
  notes: string | null;
}

export interface InspectionReviewDto {
  reviewerName: string;
  decision: ReviewDecision;
  reason: string | null;
  reviewedAt: string;
}
