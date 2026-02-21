import { Inject, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { and, eq, isNull, isNotNull } from 'drizzle-orm';
import type { AuthUser, AuthMeResponse, Role } from '@ssm/shared';
import { canUserAccess } from '@ssm/shared';
import { DRIZZLE } from '../database/drizzle.provider';
import type { DrizzleDB } from '../database/drizzle.provider';
import {
  users,
  refreshTokens,
  employees,
  userAgencyAssignments,
  agencies,
  employeeSiteAssignments,
  sites,
  appSettings,
} from '../database/schema';
import type { TokenResponse } from './dto/token-response.dto';

const BCRYPT_ROUNDS = 12;
const RESOURCES = [
  'companies', 'agencies', 'sites', 'employees', 'users',
  'inspections', 'inspection_templates', 'trainings', 'issues', 'reports', 'settings',
] as const;
const ACTIONS = ['read', 'create', 'update', 'delete'] as const;

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ─── LOGIN ──────────────────────────────────────────────
  async login(email: string, password: string): Promise<TokenResponse> {
    const user = await this.db.query.users.findFirst({
      where: and(eq(users.email, email), isNull(users.deletedAt)),
    });

    if (!user) {
      // Timing-safe: run bcrypt even when user not found
      await bcrypt.compare(password, '$2b$12$dummyhashfortimingatck000000000000000000000000000000');
      throw new UnauthorizedException('Email sau parolă incorectă');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Contul este dezactivat');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Email sau parolă incorectă');
    }

    // Update last login
    await this.db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    return this.issueTokenPair(user);
  }

  // ─── REFRESH ────────────────────────────────────────────
  async refresh(rawToken: string): Promise<TokenResponse> {
    const tokenHash = this.hashToken(rawToken);

    const storedToken = await this.db.query.refreshTokens.findFirst({
      where: eq(refreshTokens.tokenHash, tokenHash),
      with: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Token de refresh invalid');
    }

    // Reuse detection: revoked token presented → revoke ALL user sessions
    if (storedToken.revokedAt) {
      await this.revokeAllUserTokens(storedToken.userId);
      throw new UnauthorizedException('Token reutilizat — toate sesiunile au fost revocate');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Token de refresh expirat');
    }

    const user = storedToken.user;
    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Contul este dezactivat sau nu există');
    }

    // Revoke old token
    await this.db.update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, storedToken.id));

    // Issue new pair and link replacement
    const tokenPair = await this.issueTokenPair(user);
    const newTokenHash = this.hashToken(tokenPair.refreshToken);

    const newStoredToken = await this.db.query.refreshTokens.findFirst({
      where: eq(refreshTokens.tokenHash, newTokenHash),
    });
    if (newStoredToken) {
      await this.db.update(refreshTokens)
        .set({ replacedBy: newStoredToken.id })
        .where(eq(refreshTokens.id, storedToken.id));
    }

    return tokenPair;
  }

  // ─── LOGOUT ─────────────────────────────────────────────
  async logout(userId: number): Promise<void> {
    await this.revokeAllUserTokens(userId);
  }

  // ─── GET ME ─────────────────────────────────────────────
  async getMe(authUser: AuthUser): Promise<AuthMeResponse> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, authUser.userId),
      with: {
        employee: true,
      },
    });

    if (!user || !user.employee) {
      throw new UnauthorizedException('Utilizatorul nu a fost găsit');
    }

    // Allocated agencies (via userAgencyAssignments)
    const agencyRows = await this.db
      .select({ uuid: agencies.uuid, name: agencies.name })
      .from(userAgencyAssignments)
      .innerJoin(agencies, eq(userAgencyAssignments.agencyId, agencies.id))
      .where(
        and(
          eq(userAgencyAssignments.userId, authUser.userId),
          isNull(userAgencyAssignments.removedAt),
          isNull(userAgencyAssignments.deletedAt),
        ),
      );

    // Allocated sites (via employee's employeeSiteAssignments)
    const siteRows = await this.db
      .select({ uuid: sites.uuid, name: sites.name })
      .from(employeeSiteAssignments)
      .innerJoin(sites, eq(employeeSiteAssignments.siteId, sites.id))
      .where(
        and(
          eq(employeeSiteAssignments.employeeId, authUser.employeeId),
          isNull(employeeSiteAssignments.removedAt),
          isNull(employeeSiteAssignments.deletedAt),
        ),
      );

    // Permissions
    const role = authUser.role;
    const permissions: string[] = [];
    for (const resource of RESOURCES) {
      for (const action of ACTIONS) {
        if (canUserAccess(role, resource, action)) {
          permissions.push(`${resource}.${action}`);
        }
      }
    }

    // Min app version from appSettings or env fallback
    let minAppVersion = this.config.get<string>('MIN_APP_VERSION', '1.0.0');
    const setting = await this.db.query.appSettings.findFirst({
      where: and(eq(appSettings.key, 'min_app_version'), isNull(appSettings.companyId)),
    });
    if (setting?.value && typeof setting.value === 'string') {
      minAppVersion = setting.value;
    }

    return {
      user: {
        uuid: user.uuid,
        email: user.email,
        role: user.role as Role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        employee: {
          uuid: user.employee.uuid,
          firstName: user.employee.firstName,
          lastName: user.employee.lastName,
        },
        createdAt: user.createdAt.toISOString(),
      },
      permissions,
      allocatedAgencies: agencyRows,
      allocatedSites: siteRows,
      minAppVersion,
    };
  }

  // ─── ACTIVATE ACCOUNT ──────────────────────────────────
  async activate(token: string, password: string): Promise<TokenResponse> {
    const payload = this.verifyPurposeToken(token, 'activate');

    const user = await this.db.query.users.findFirst({
      where: and(eq(users.id, payload.userId), isNull(users.deletedAt)),
    });

    if (!user) {
      throw new BadRequestException('Token de activare invalid');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await this.db.update(users)
      .set({ passwordHash, isActive: true })
      .where(eq(users.id, user.id));

    return this.issueTokenPair(user);
  }

  // ─── FORGOT PASSWORD ───────────────────────────────────
  async forgotPassword(email: string): Promise<void> {
    const user = await this.db.query.users.findFirst({
      where: and(eq(users.email, email), isNull(users.deletedAt), eq(users.isActive, true)),
    });

    // Always return success to prevent email enumeration
    if (!user) return;

    const resetToken = this.jwtService.sign(
      { userId: user.id, purpose: 'reset' },
      { expiresIn: '1h' },
    );

    // MVP: log to console instead of sending email
    console.log('───────────────────────────────────────');
    console.log(`Link resetare parolă pentru ${email}:`);
    console.log(`${this.config.get('APP_URL')}/reset-password?token=${resetToken}`);
    console.log('───────────────────────────────────────');
  }

  // ─── RESET PASSWORD ────────────────────────────────────
  async resetPassword(token: string, password: string): Promise<void> {
    const payload = this.verifyPurposeToken(token, 'reset');

    const user = await this.db.query.users.findFirst({
      where: and(eq(users.id, payload.userId), isNull(users.deletedAt)),
    });

    if (!user) {
      throw new BadRequestException('Token de resetare invalid');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await this.db.update(users)
      .set({ passwordHash })
      .where(eq(users.id, user.id));

    // Revoke all sessions — force re-login
    await this.revokeAllUserTokens(user.id);
  }

  // ─── PRIVATE HELPERS ───────────────────────────────────

  private async issueTokenPair(user: {
    id: number;
    uuid: string;
    employeeId: number;
    companyId: number;
    role: string;
    email: string;
  }): Promise<TokenResponse> {
    const jwtPayload = {
      sub: user.uuid,
      userId: user.id,
      employeeId: user.employeeId,
      companyId: user.companyId,
      role: user.role,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(jwtPayload, {
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    // Raw refresh token = 32 random bytes → hex
    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);

    const refreshExpiry = this.config.get('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresAt = new Date(Date.now() + this.parseDuration(refreshExpiry));

    await this.db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  private async revokeAllUserTokens(userId: number): Promise<void> {
    await this.db.update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.userId, userId),
          isNull(refreshTokens.revokedAt),
        ),
      );
  }

  private verifyPurposeToken(token: string, expectedPurpose: string): { userId: number } {
    try {
      const payload = this.jwtService.verify(token) as { userId: number; purpose: string };
      if (payload.purpose !== expectedPurpose) {
        throw new BadRequestException('Token invalid');
      }
      return { userId: payload.userId };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Token invalid sau expirat');
    }
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7d
    const value = parseInt(match[1]!, 10);
    const unit = match[2]!;
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  }
}
