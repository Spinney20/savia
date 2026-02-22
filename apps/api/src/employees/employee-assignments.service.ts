import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import type { AuthUser, EmployeeSiteAssignmentDto, AssignEmployeeToSiteInput } from '@ssm/shared';
import { DRIZZLE } from '../database/drizzle.provider';
import type { DrizzleDB } from '../database/drizzle.provider';
import { employeeSiteAssignments, sites } from '../database/schema';
import { EmployeesService } from './employees.service';

@Injectable()
export class EmployeeAssignmentsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly employeesService: EmployeesService,
  ) {}

  // ─── LIST ACTIVE ASSIGNMENTS ────────────────────────────
  async list(authUser: AuthUser, employeeUuid: string): Promise<EmployeeSiteAssignmentDto[]> {
    const emp = await this.employeesService.resolveEmployee(authUser, employeeUuid);

    const rows = await this.db
      .select({
        assignment: employeeSiteAssignments,
        siteUuid: sites.uuid,
      })
      .from(employeeSiteAssignments)
      .innerJoin(sites, eq(employeeSiteAssignments.siteId, sites.id))
      .where(
        and(
          eq(employeeSiteAssignments.employeeId, emp.id),
          isNull(employeeSiteAssignments.removedAt),
          isNull(employeeSiteAssignments.deletedAt),
        ),
      )
      .orderBy(employeeSiteAssignments.assignedAt);

    return rows.map((r) => this.toAssignmentDto(r.assignment, employeeUuid, r.siteUuid));
  }

  // ─── ASSIGN TO SITE ────────────────────────────────────
  async assign(
    authUser: AuthUser,
    employeeUuid: string,
    input: AssignEmployeeToSiteInput,
  ): Promise<EmployeeSiteAssignmentDto> {
    const emp = await this.employeesService.resolveEmployee(authUser, employeeUuid);

    // Resolve site by UUID within company scope
    const site = await this.db.query.sites.findFirst({
      where: and(
        eq(sites.uuid, input.siteUuid),
        eq(sites.companyId, authUser.companyId),
        isNull(sites.deletedAt),
      ),
    });
    if (!site) {
      throw new NotFoundException('Șantierul nu a fost găsit');
    }

    // Check for existing active assignment
    const existing = await this.db.query.employeeSiteAssignments.findFirst({
      where: and(
        eq(employeeSiteAssignments.employeeId, emp.id),
        eq(employeeSiteAssignments.siteId, site.id),
        isNull(employeeSiteAssignments.removedAt),
        isNull(employeeSiteAssignments.deletedAt),
      ),
    });
    if (existing) {
      throw new ConflictException('Angajatul este deja asignat la acest șantier');
    }

    const [assignment] = await this.db
      .insert(employeeSiteAssignments)
      .values({
        employeeId: emp.id,
        siteId: site.id,
        assignedBy: authUser.userId,
        notes: input.notes ?? null,
      })
      .returning();

    return this.toAssignmentDto(assignment!, employeeUuid, input.siteUuid);
  }

  // ─── UNASSIGN FROM SITE ────────────────────────────────
  async unassign(authUser: AuthUser, employeeUuid: string, siteUuid: string): Promise<void> {
    const emp = await this.employeesService.resolveEmployee(authUser, employeeUuid);

    const site = await this.db.query.sites.findFirst({
      where: and(
        eq(sites.uuid, siteUuid),
        eq(sites.companyId, authUser.companyId),
        isNull(sites.deletedAt),
      ),
    });
    if (!site) {
      throw new NotFoundException('Șantierul nu a fost găsit');
    }

    const existing = await this.db.query.employeeSiteAssignments.findFirst({
      where: and(
        eq(employeeSiteAssignments.employeeId, emp.id),
        eq(employeeSiteAssignments.siteId, site.id),
        isNull(employeeSiteAssignments.removedAt),
        isNull(employeeSiteAssignments.deletedAt),
      ),
    });
    if (!existing) {
      throw new NotFoundException('Asignarea nu a fost găsită');
    }

    await this.db
      .update(employeeSiteAssignments)
      .set({ removedAt: new Date() })
      .where(eq(employeeSiteAssignments.id, existing.id));
  }

  // ─── HELPERS ────────────────────────────────────────────

  private toAssignmentDto(
    a: typeof employeeSiteAssignments.$inferSelect,
    employeeUuid: string,
    siteUuid: string,
  ): EmployeeSiteAssignmentDto {
    return {
      employeeUuid,
      siteUuid,
      assignedAt: a.assignedAt.toISOString(),
      removedAt: a.removedAt?.toISOString() ?? null,
      notes: a.notes,
    };
  }
}
