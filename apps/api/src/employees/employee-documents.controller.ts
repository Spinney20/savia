import { Controller, Get, Post, Param, Body, UsePipes } from '@nestjs/common';
import { CreateEmployeeDocumentSchema } from '@ssm/shared';
import type { AuthUser, CreateEmployeeDocumentInput } from '@ssm/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { EmployeeDocumentsService } from './employee-documents.service';

@Controller('employees/:uuid/documents')
export class EmployeeDocumentsController {
  constructor(private readonly documentsService: EmployeeDocumentsService) {}

  @Get()
  @Roles('SEF_SANTIER')
  list(@CurrentUser() user: AuthUser, @Param('uuid', ParseUuidPipe) uuid: string) {
    return this.documentsService.list(user, uuid);
  }

  @Post()
  @Roles('INSPECTOR_SSM')
  @UsePipes(new ZodValidationPipe(CreateEmployeeDocumentSchema))
  create(
    @CurrentUser() user: AuthUser,
    @Param('uuid', ParseUuidPipe) uuid: string,
    @Body() body: CreateEmployeeDocumentInput,
  ) {
    return this.documentsService.create(user, uuid, body);
  }
}
