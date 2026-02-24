import { Controller, Get, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { Public } from '../common/decorators/public.decorator';
import { DRIZZLE } from '../database/drizzle.provider';
import type { DrizzleDB } from '../database/drizzle.provider';

@Public()
@Controller('health')
export class HealthController {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('db')
  async checkDb() {
    try {
      await this.db.execute(sql`SELECT 1`);
      return {
        status: 'ok',
        database: 'connected',
      };
    } catch {
      return {
        status: 'error',
        database: 'disconnected',
      };
    }
  }
}
