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
  CreateInspectionSchema,
  UpdateInspectionDraftSchema,
} from '@ssm/shared';
import type {
  AuthUser,
  CreateInspectionInput,
  UpdateInspectionDraftInput,
} from '@ssm/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { InspectionsService } from './inspections.service';

@Controller('inspections')
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Get()
  @Roles('SEF_SANTIER')
  list(@CurrentUser() user: AuthUser, @Query() query: Record<string, unknown>) {
    return this.inspectionsService.list(user, query);
  }

  @Post()
  @Roles('INSPECTOR_SSM')
  @UsePipes(new ZodValidationPipe(CreateInspectionSchema))
  create(@CurrentUser() user: AuthUser, @Body() body: CreateInspectionInput) {
    return this.inspectionsService.create(user, body);
  }

  @Get(':uuid')
  @Roles('SEF_SANTIER')
  findOne(@CurrentUser() user: AuthUser, @Param('uuid', ParseUuidPipe) uuid: string) {
    return this.inspectionsService.findOne(user, uuid);
  }

  @Patch(':uuid')
  @Roles('INSPECTOR_SSM')
  @UsePipes(new ZodValidationPipe(UpdateInspectionDraftSchema))
  updateDraft(
    @CurrentUser() user: AuthUser,
    @Param('uuid', ParseUuidPipe) uuid: string,
    @Body() body: UpdateInspectionDraftInput,
  ) {
    return this.inspectionsService.updateDraft(user, uuid, body);
  }

  @Delete(':uuid')
  @Roles('INSPECTOR_SSM')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthUser, @Param('uuid', ParseUuidPipe) uuid: string) {
    await this.inspectionsService.remove(user, uuid);
  }

  @Post(':uuid/submit')
  @Roles('INSPECTOR_SSM')
  @HttpCode(HttpStatus.OK)
  submit(@CurrentUser() user: AuthUser, @Param('uuid', ParseUuidPipe) uuid: string) {
    return this.inspectionsService.submit(user, uuid);
  }

  @Post(':uuid/revise')
  @Roles('INSPECTOR_SSM')
  @HttpCode(HttpStatus.OK)
  revise(@CurrentUser() user: AuthUser, @Param('uuid', ParseUuidPipe) uuid: string) {
    return this.inspectionsService.revise(user, uuid);
  }

  @Post(':uuid/close')
  @Roles('SEF_AGENTIE')
  @HttpCode(HttpStatus.OK)
  close(@CurrentUser() user: AuthUser, @Param('uuid', ParseUuidPipe) uuid: string) {
    return this.inspectionsService.close(user, uuid);
  }

  @Get(':uuid/pdf')
  @Roles('INSPECTOR_SSM')
  async getPdf(@CurrentUser() user: AuthUser, @Param('uuid', ParseUuidPipe) uuid: string) {
    const pdfUrl = await this.inspectionsService.getPdf(user, uuid);
    return { pdfUrl };
  }
}
