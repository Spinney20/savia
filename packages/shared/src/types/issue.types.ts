/**
 * Issue report types — problem reporting workflow
 */

import type { Severity } from './inspection.types.js';

export const ISSUE_STATUSES = [
  'REPORTED',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'VERIFIED',
  'REOPENED',
  'CLOSED',
] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export { Severity as IssueSeverity };

export interface IssueCategoryDto {
  uuid: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sortOrder: number;
}

export interface IssueReportDto {
  uuid: string;
  siteUuid: string;
  categoryName: string | null;
  reporterName: string;
  title: string;
  description: string;
  severity: Severity;
  status: IssueStatus;
  latitude: number | null;
  longitude: number | null;
  reportedAt: string;
  resolvedAt: string | null;
  deadline: string | null;
  createdAt: string;
}

export interface IssueCommentDto {
  authorName: string;
  content: string;
  isSystem: boolean;
  createdAt: string;
}

export interface IssueAssignmentDto {
  assignedToName: string;
  assignedByName: string;
  deadline: string | null;
  notes: string | null;
  isActive: boolean;
  assignedAt: string;
}
