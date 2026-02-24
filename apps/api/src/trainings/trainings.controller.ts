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
  CreateTrainingSchema,
  ConfirmParticipationSchema,
  UpdateParticipantsSchema,
} from '@ssm/shared';
import type {
  AuthUser,
  CreateTrainingInput,
  ConfirmParticipationInput,
  UpdateParticipantsInput,
} from '@ssm/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { TrainingsService } from './trainings.service';

@Controller('trainings')
export class TrainingsController {
  constructor(private readonly trainingsService: TrainingsService) {}

  @Get()
  @Roles('SEF_SANTIER')
  list(@CurrentUser() user: AuthUser, @Query() query: Record<string, unknown>) {
    return this.trainingsService.list(user, query);
  }

  @Post()
  @Roles('SEF_SANTIER')
  @UsePipes(new ZodValidationPipe(CreateTrainingSchema))
  create(@CurrentUser() user: AuthUser, @Body() body: CreateTrainingInput) {
    return this.trainingsService.create(user, body);
  }

  @Get(':uuid')
  @Roles('SEF_SANTIER')
  findOne(@CurrentUser() user: AuthUser, @Param('uuid', ParseUuidPipe) uuid: string) {
    return this.trainingsService.findOne(user, uuid);
  }

  @Delete(':uuid')
  @Roles('MANAGER_SSM')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthUser, @Param('uuid', ParseUuidPipe) uuid: string) {
    await this.trainingsService.remove(user, uuid);
  }

  @Post(':uuid/confirm')
  @Roles('MUNCITOR')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(ConfirmParticipationSchema))
  confirm(
    @CurrentUser() user: AuthUser,
    @Param('uuid', ParseUuidPipe) uuid: string,
    @Body() body: ConfirmParticipationInput,
  ) {
    return this.trainingsService.confirm(user, uuid, body);
  }

  @Patch(':uuid/participants')
  @Roles('SEF_SANTIER')
  @UsePipes(new ZodValidationPipe(UpdateParticipantsSchema))
  updateParticipants(
    @CurrentUser() user: AuthUser,
    @Param('uuid', ParseUuidPipe) uuid: string,
    @Body() body: UpdateParticipantsInput,
  ) {
    return this.trainingsService.updateParticipants(user, uuid, body);
  }

  @Get(':uuid/pdf')
  @Roles('INSPECTOR_SSM')
  getPdf(@CurrentUser() user: AuthUser, @Param('uuid', ParseUuidPipe) uuid: string) {
    return this.trainingsService.getPdf(user, uuid);
  }
}
