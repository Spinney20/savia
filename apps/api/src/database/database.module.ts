import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DRIZZLE, createDrizzleConnection } from './drizzle.provider';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.getOrThrow<string>('DATABASE_URL');
        return createDrizzleConnection(databaseUrl);
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
