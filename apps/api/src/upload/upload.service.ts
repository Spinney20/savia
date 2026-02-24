import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import type { Readable } from 'node:stream';
import type { AuthUser } from '@ssm/shared';
import { DRIZZLE } from '../database/drizzle.provider';
import type { DrizzleDB } from '../database/drizzle.provider';
import { attachments } from '../database/schema';
import { STORAGE_SERVICE, StorageService } from '../storage/storage.interface';
import { eq, and, isNull } from 'drizzle-orm';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

@Injectable()
export class UploadService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  async upload(
    authUser: AuthUser,
    file: Express.Multer.File,
  ): Promise<{ uuid: string; fileName: string; mimeType: string; fileSize: number }> {
    if (!file) {
      throw new BadRequestException('Niciun fișier nu a fost încărcat');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Fișierul depășește limita de 20 MB');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Tipul de fișier nu este permis');
    }

    const fileUuid = crypto.randomUUID();
    const ext = path.extname(file.originalname) || '';
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    const key = `${authUser.companyId}/uploads/${year}/${month}/${fileUuid}${ext}`;

    const storedKey = await this.storage.upload({
      key,
      buffer: file.buffer,
      mimeType: file.mimetype,
    });

    // Insert orphan attachment (all entity FKs null)
    const [attachment] = await this.db.insert(attachments).values({
      companyId: authUser.companyId,
      fileUrl: storedKey,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedBy: authUser.userId,
    }).returning();

    return {
      uuid: attachment!.uuid,
      fileName: attachment!.fileName,
      mimeType: attachment!.mimeType,
      fileSize: attachment!.fileSize,
    };
  }

  async getFile(
    authUser: AuthUser,
    uuid: string,
  ): Promise<{ url: string; fileName: string; mimeType: string }> {
    const attachment = await this.db.query.attachments.findFirst({
      where: and(
        eq(attachments.uuid, uuid),
        eq(attachments.companyId, authUser.companyId),
        isNull(attachments.deletedAt),
      ),
    });

    if (!attachment) {
      throw new NotFoundException('Fișierul nu a fost găsit');
    }

    const url = await this.storage.getSignedUrl(attachment.fileUrl);

    return {
      url,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
    };
  }

  async downloadFile(
    authUser: AuthUser,
    uuid: string,
  ): Promise<{ stream: Readable; fileName: string; mimeType: string }> {
    const attachment = await this.db.query.attachments.findFirst({
      where: and(
        eq(attachments.uuid, uuid),
        eq(attachments.companyId, authUser.companyId),
        isNull(attachments.deletedAt),
      ),
    });

    if (!attachment) {
      throw new NotFoundException('Fișierul nu a fost găsit');
    }

    const stream = await this.storage.getStream(attachment.fileUrl);

    return {
      stream,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
    };
  }
}
