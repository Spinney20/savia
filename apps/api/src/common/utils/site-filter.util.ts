import { and, eq, isNull } from 'drizzle-orm';
import type { DrizzleDB } from '../../database/drizzle.provider';
import { employeeSiteAssignments } from '../../database/schema';

/**
 * Returns site IDs the employee is currently assigned to.
 * Used for site-level data isolation for roles below SEF_AGENTIE.
 */
export async function getUserSiteIds(db: DrizzleDB, employeeId: number): Promise<number[]> {
  const rows = await db
    .select({ siteId: employeeSiteAssignments.siteId })
    .from(employeeSiteAssignments)
    .where(
      and(
        eq(employeeSiteAssignments.employeeId, employeeId),
        isNull(employeeSiteAssignments.removedAt),
        isNull(employeeSiteAssignments.deletedAt),
      ),
    );

  return rows.map((r) => r.siteId);
}
