import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { and, lt, isNotNull, or } from 'drizzle-orm';
import { DRIZZLE } from '../database/drizzle.provider';
import type { DrizzleDB } from '../database/drizzle.provider';
import { refreshTokens } from '../database/schema';

@Injectable()
export class CleanupRefreshTokensJob {
  private readonly logger = new Logger(CleanupRefreshTokensJob.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) {}

  @Cron('0 3 * * *', { name: 'cleanup-refresh-tokens' })
  async handleCron(): Promise<void> {
    try {
      this.logger.log('Curățare token-uri de refresh expirate...');

      const now = new Date();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const result = await this.db.delete(refreshTokens).where(
        or(
          lt(refreshTokens.expiresAt, now),
          and(
            isNotNull(refreshTokens.revokedAt),
            lt(refreshTokens.revokedAt, thirtyDaysAgo),
          ),
        ),
      ).returning({ id: refreshTokens.id });

      this.logger.log(`Șterse ${result.length} token-uri de refresh`);
    } catch (error) {
      this.logger.error(`Eroare la curățarea token-urilor: ${error}`);
    }
  }
}
