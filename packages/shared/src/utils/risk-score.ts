import type { Severity } from '../types/inspection.types.js';

interface RiskItem {
  isCompliant: boolean | null;
  riskScore: number | null;
  severity: Severity | null;
}

const SEVERITY_WEIGHT: Record<Severity, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 5,
};

/**
 * Calculate overall risk score from inspection items.
 * Returns a score from 0 (no risk) to 100 (maximum risk).
 */
export function calculateRiskScore(items: RiskItem[]): number {
  if (items.length === 0) return 0;

  let totalWeightedScore = 0;
  let maxPossibleScore = 0;

  for (const item of items) {
    const baseScore = item.riskScore ?? 5;
    const severityWeight = item.severity ? SEVERITY_WEIGHT[item.severity] : 1;

    maxPossibleScore += baseScore * 5; // max severity weight is 5

    if (item.isCompliant === false) {
      totalWeightedScore += baseScore * severityWeight;
    }
  }

  if (maxPossibleScore === 0) return 0;
  return Math.round((totalWeightedScore / maxPossibleScore) * 100 * 100) / 100;
}

/**
 * Count compliant / non-compliant / N/A items
 */
export function countComplianceStats(items: RiskItem[]) {
  let compliant = 0;
  let nonCompliant = 0;
  let notApplicable = 0;

  for (const item of items) {
    if (item.isCompliant === true) compliant++;
    else if (item.isCompliant === false) nonCompliant++;
    else notApplicable++;
  }

  return { compliant, nonCompliant, notApplicable, total: items.length };
}
