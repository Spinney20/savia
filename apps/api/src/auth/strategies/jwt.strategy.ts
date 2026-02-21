import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { isNull } from 'drizzle-orm';
import { eq, and } from 'drizzle-orm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthUser } from '@ssm/shared';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { DrizzleDB } from '../../database/drizzle.provider';
import { users } from '../../database/schema';

interface JwtPayload {
  sub: string;
  userId: number;
  employeeId: number;
  companyId: number;
  role: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.db.query.users.findFirst({
      where: and(
        eq(users.id, payload.userId),
        eq(users.isActive, true),
        isNull(users.deletedAt),
      ),
    });

    if (!user) {
      throw new UnauthorizedException('Contul este dezactivat sau nu există');
    }

    return {
      userId: payload.userId,
      uuid: payload.sub,
      employeeId: payload.employeeId,
      companyId: payload.companyId,
      role: payload.role as AuthUser['role'],
      email: payload.email,
    };
  }
}
