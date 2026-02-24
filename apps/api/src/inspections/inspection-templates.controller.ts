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
  CreateTemplateSchema,
  UpdateTemplateSchema,
  PublishTemplateVersionSchema,
} from '@ssm/shared';
import type {
  AuthUser,
  CreateTemplateInput,
  UpdateTemplateInput,
  PublishTemplateVersionInput,
} from '@ssm/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { InspectionTemplatesService } from './inspection-templates.service';

@Controller('inspection-templates')
export class InspectionTemplatesController {
  constructor(private readonly templatesService: InspectionTemplatesService) {}

  @Get()
  @Roles('SEF_SANTIER')
  list(@CurrentUser() user: AuthUser, @Query() query: Record<string, unknown>) {
    return this.templatesService.list(user, query);
  }

  @Post()
  @Roles('SEF_AGENTIE')
  @UsePipes(new ZodValidationPipe(CreateTemplateSchema))
  create(@CurrentUser() user: AuthUser, @Body() body: CreateTemplateInput) {
    return this.templatesService.create(user, body);
  }

  @Get(':uuid')
  @Roles('SEF_SANTIER')
  findOne(@CurrentUser() user: AuthUser, @Param('uuid', ParseUuidPipe) uuid: string) {
    return this.templatesService.findOne(user, uuid);
  }

  @Patch(':uuid')
  @Roles('SEF_AGENTIE')
  @UsePipes(new ZodValidationPipe(UpdateTemplateSchema))
  update(
    @CurrentUser() user: AuthUser,
    @Param('uuid', ParseUuidPipe) uuid: string,
    @Body() body: UpdateTemplateInput,
  ) {
    return this.templatesService.update(user, uuid, body);
  }

  @Delete(':uuid')
  @Roles('MANAGER_SSM')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthUser, @Param('uuid', ParseUuidPipe) uuid: string) {
    await this.templatesService.remove(user, uuid);
  }

  @Post(':uuid/versions')
  @Roles('SEF_AGENTIE')
  @UsePipes(new ZodValidationPipe(PublishTemplateVersionSchema))
  publishVersion(
    @CurrentUser() user: AuthUser,
    @Param('uuid', ParseUuidPipe) uuid: string,
    @Body() body: PublishTemplateVersionInput,
  ) {
    return this.templatesService.publishVersion(user, uuid, body);
  }
}
