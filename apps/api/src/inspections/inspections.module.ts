import { Module } from '@nestjs/common';
import { InspectionTemplatesController } from './inspection-templates.controller';
import { InspectionTemplatesService } from './inspection-templates.service';
import { InspectionsController } from './inspections.controller';
import { InspectionsService } from './inspections.service';
import { InspectionReviewsController } from './inspection-reviews.controller';
import { InspectionReviewsService } from './inspection-reviews.service';

@Module({
  controllers: [
    InspectionTemplatesController,
    InspectionsController,
    InspectionReviewsController,
  ],
  providers: [
    InspectionTemplatesService,
    InspectionsService,
    InspectionReviewsService,
  ],
  exports: [InspectionsService, InspectionTemplatesService],
})
export class InspectionsModule {}
