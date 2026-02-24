import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Readable } from 'node:stream';
import { StorageService } from './storage.interface';
import type { UploadParams } from './storage.interface';

@Injectable()
export class LocalStorageService extends StorageService {
  private readonly basePath: string;

  constructor() {
    super();
    this.basePath = path.resolve(process.cwd(), 'uploads');
  }

  private safePath(key: string): string {
    const resolved = path.resolve(this.basePath, key);
    if (!resolved.startsWith(this.basePath + path.sep) && resolved !== this.basePath) {
      throw new BadRequestException('Cale de fișier invalidă');
    }
    return resolved;
  }

  async upload(params: UploadParams): Promise<string> {
    const filePath = this.safePath(params.key);
    const dir = path.dirname(filePath);

    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(filePath, params.buffer);

    return params.key;
  }

  async getSignedUrl(_key: string): Promise<string> {
    // Local files are served via the authenticated /api/files/:uuid/download endpoint
    return '';
  }

  async delete(key: string): Promise<void> {
    const filePath = this.safePath(key);
    try {
      await fs.promises.unlink(filePath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  async getStream(key: string): Promise<Readable> {
    const filePath = this.safePath(key);
    try {
      await fs.promises.access(filePath);
    } catch {
      throw new NotFoundException('Fișierul nu a fost găsit');
    }
    return fs.createReadStream(filePath);
  }
}
