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
  CreateIssueSchema,
  UpdateIssueStatusSchema,
  AssignIssueSchema,
} from '@ssm/shared';
import type {
  AuthUser,
  CreateIssueInput,
  UpdateIssueStatusInput,
  AssignIssueInput,
} from '@ssm/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { IssuesService } from './issues.service';

@Controller('issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get('categories')
  @Roles('MUNCITOR')
  listCategories(@CurrentUser() user: AuthUser) {
    return this.issuesService.listCategories(user);
  }

  @Get()
  @Roles('MUNCITOR')
  list(@CurrentUser() user: AuthUser, @Query() query: Record<string, unknown>) {
    return this.issuesService.list(user, query);
  }

  @Post()
  @Roles('MUNCITOR')
  @UsePipes(new ZodValidationPipe(CreateIssueSchema))
  create(@CurrentUser() user: AuthUser, @Body() body: CreateIssueInput) {
    return this.issuesService.create(user, body);
  }

  @Get(':uuid')
  @Roles('MUNCITOR')
  findOne(@CurrentUser() user: AuthUser, @Param('uuid') uuid: string) {
    return this.issuesService.findOne(user, uuid);
  }

  @Patch(':uuid/status')
  @Roles('SEF_SANTIER')
  @UsePipes(new ZodValidationPipe(UpdateIssueStatusSchema))
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('uuid') uuid: string,
    @Body() body: UpdateIssueStatusInput,
  ) {
    return this.issuesService.updateStatus(user, uuid, body);
  }

  @Patch(':uuid/assign')
  @Roles('SEF_SANTIER')
  @UsePipes(new ZodValidationPipe(AssignIssueSchema))
  assign(
    @CurrentUser() user: AuthUser,
    @Param('uuid') uuid: string,
    @Body() body: AssignIssueInput,
  ) {
    return this.issuesService.assign(user, uuid, body);
  }

  @Delete(':uuid')
  @Roles('MANAGER_SSM')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthUser, @Param('uuid') uuid: string) {
    await this.issuesService.remove(user, uuid);
  }
}
