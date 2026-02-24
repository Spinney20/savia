import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UsePipes,
} from '@nestjs/common';
import { CreateIssueCommentSchema } from '@ssm/shared';
import type { AuthUser, CreateIssueCommentInput } from '@ssm/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { IssueCommentsService } from './issue-comments.service';

@Controller('issues/:uuid/comments')
export class IssueCommentsController {
  constructor(private readonly commentsService: IssueCommentsService) {}

  @Post()
  @Roles('MUNCITOR')
  @UsePipes(new ZodValidationPipe(CreateIssueCommentSchema))
  create(
    @CurrentUser() user: AuthUser,
    @Param('uuid', ParseUuidPipe) uuid: string,
    @Body() body: CreateIssueCommentInput,
  ) {
    return this.commentsService.create(user, uuid, body);
  }

  @Get()
  @Roles('MUNCITOR')
  list(@CurrentUser() user: AuthUser, @Param('uuid', ParseUuidPipe) uuid: string) {
    return this.commentsService.list(user, uuid);
  }
}
