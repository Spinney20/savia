import {
  Controller,
  Get,
  Header,
  Post,
  Param,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { AuthUser } from '@ssm/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { UploadService } from './upload.service';

@Controller()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('upload')
  @Roles('MUNCITOR')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
  }))
  upload(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadService.upload(user, file);
  }

  @Get('files/:uuid')
  @Roles('MUNCITOR')
  getFile(
    @CurrentUser() user: AuthUser,
    @Param('uuid', ParseUuidPipe) uuid: string,
  ) {
    return this.uploadService.getFile(user, uuid);
  }

  @Get('files/:uuid/download')
  @Roles('MUNCITOR')
  @Header('Cache-Control', 'private, max-age=3600')
  async downloadFile(
    @CurrentUser() user: AuthUser,
    @Param('uuid', ParseUuidPipe) uuid: string,
  ): Promise<StreamableFile> {
    const { stream, fileName, mimeType } = await this.uploadService.downloadFile(user, uuid);
    return new StreamableFile(stream, {
      type: mimeType,
      disposition: `inline; filename="${encodeURIComponent(fileName)}"`,
    });
  }
}
