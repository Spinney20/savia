import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { EmployeesController } from './employees.controller';
import { EmployeeDocumentsController } from './employee-documents.controller';
import { EmployeeAssignmentsController } from './employee-assignments.controller';
import { EmployeesService } from './employees.service';
import { EmployeeDocumentsService } from './employee-documents.service';
import { EmployeeAssignmentsService } from './employee-assignments.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
        },
      }),
    }),
  ],
  controllers: [
    EmployeesController,
    EmployeeDocumentsController,
    EmployeeAssignmentsController,
  ],
  providers: [
    EmployeesService,
    EmployeeDocumentsService,
    EmployeeAssignmentsService,
  ],
  exports: [EmployeesService],
})
export class EmployeesModule {}
