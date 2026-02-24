import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
} from '@nestjs/common';
import {
  CreateEmployeeSchema,
  UpdateEmployeeSchema,
  CreateUserForEmployeeSchema,
} from '@ssm/shared';
import type {
  AuthUser,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  CreateUserForEmployeeInput,
} from '@ssm/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { EmployeesService } from './employees.service';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @Roles('SEF_SANTIER')
  list(@CurrentUser() user: AuthUser, @Query() query: Record<string, unknown>) {
    return this.employeesService.list(user, query);
  }

  @Post()
  @Roles('SEF_AGENTIE')
  @UsePipes(new ZodValidationPipe(CreateEmployeeSchema))
  create(@CurrentUser() user: AuthUser, @Body() body: CreateEmployeeInput) {
    return this.employeesService.create(user, body);
  }

  @Get(':uuid')
  @Roles('SEF_SANTIER')
  findOne(@CurrentUser() user: AuthUser, @Param('uuid', ParseUuidPipe) uuid: string) {
    return this.employeesService.findOne(user, uuid);
  }

  @Patch(':uuid')
  @Roles('SEF_AGENTIE')
  @UsePipes(new ZodValidationPipe(UpdateEmployeeSchema))
  update(
    @CurrentUser() user: AuthUser,
    @Param('uuid', ParseUuidPipe) uuid: string,
    @Body() body: UpdateEmployeeInput,
  ) {
    return this.employeesService.update(user, uuid, body);
  }

  @Delete(':uuid')
  @Roles('SEF_AGENTIE')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthUser, @Param('uuid', ParseUuidPipe) uuid: string) {
    await this.employeesService.remove(user, uuid);
  }

  @Post(':uuid/user')
  @Roles('SEF_AGENTIE')
  @UsePipes(new ZodValidationPipe(CreateUserForEmployeeSchema))
  createUser(
    @CurrentUser() user: AuthUser,
    @Param('uuid', ParseUuidPipe) uuid: string,
    @Body() body: CreateUserForEmployeeInput,
  ) {
    return this.employeesService.createUserAccount(user, uuid, body);
  }
}
