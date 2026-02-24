import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
} from '@nestjs/common';
import { AssignEmployeeToSiteSchema } from '@ssm/shared';
import type { AuthUser, AssignEmployeeToSiteInput } from '@ssm/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { EmployeeAssignmentsService } from './employee-assignments.service';

@Controller('employees/:uuid/sites')
export class EmployeeAssignmentsController {
  constructor(private readonly assignmentsService: EmployeeAssignmentsService) {}

  @Get()
  @Roles('SEF_SANTIER')
  list(@CurrentUser() user: AuthUser, @Param('uuid', ParseUuidPipe) uuid: string) {
    return this.assignmentsService.list(user, uuid);
  }

  @Post()
  @Roles('SEF_AGENTIE')
  @UsePipes(new ZodValidationPipe(AssignEmployeeToSiteSchema))
  assign(
    @CurrentUser() user: AuthUser,
    @Param('uuid', ParseUuidPipe) uuid: string,
    @Body() body: AssignEmployeeToSiteInput,
  ) {
    return this.assignmentsService.assign(user, uuid, body);
  }

  @Delete(':siteUuid')
  @Roles('SEF_AGENTIE')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unassign(
    @CurrentUser() user: AuthUser,
    @Param('uuid', ParseUuidPipe) uuid: string,
    @Param('siteUuid') siteUuid: string,
  ) {
    await this.assignmentsService.unassign(user, uuid, siteUuid);
  }
}
