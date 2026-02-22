import { Module } from '@nestjs/common';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { IssueCommentsController } from './issue-comments.controller';
import { IssueCommentsService } from './issue-comments.service';

@Module({
  controllers: [IssuesController, IssueCommentsController],
  providers: [IssuesService, IssueCommentsService],
  exports: [IssuesService],
})
export class IssuesModule {}
