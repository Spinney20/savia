import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UsePipes,
} from '@nestjs/common';
import { ReviewInspectionSchema } from '@ssm/shared';
import type { AuthUser, ReviewInspectionInput } from '@ssm/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { InspectionReviewsService } from './inspection-reviews.service';

@Controller('inspections/:uuid/reviews')
export class InspectionReviewsController {
  constructor(private readonly reviewsService: InspectionReviewsService) {}

  @Post()
  @Roles('SEF_AGENTIE')
  @UsePipes(new ZodValidationPipe(ReviewInspectionSchema))
  create(
    @CurrentUser() user: AuthUser,
    @Param('uuid', ParseUuidPipe) uuid: string,
    @Body() body: ReviewInspectionInput,
  ) {
    return this.reviewsService.createReview(user, uuid, body);
  }

  @Get()
  @Roles('SEF_SANTIER')
  list(@CurrentUser() user: AuthUser, @Param('uuid', ParseUuidPipe) uuid: string) {
    return this.reviewsService.listReviews(user, uuid);
  }
}
