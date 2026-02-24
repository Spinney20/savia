import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} from '@azure/storage-blob';
import type { Readable } from 'node:stream';
import { StorageService } from './storage.interface';
import type { UploadParams } from './storage.interface';

@Injectable()
export class AzureBlobStorageService extends StorageService {
  private readonly blobServiceClient: BlobServiceClient;
  private readonly containerName: string;

  constructor(private readonly config: ConfigService) {
    super();
    const connectionString = this.config.getOrThrow<string>('AZURE_STORAGE_CONNECTION_STRING');
    this.containerName = this.config.get<string>('AZURE_STORAGE_CONTAINER', 'ssm-uploads');
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }

  async upload(params: UploadParams): Promise<string> {
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    await containerClient.createIfNotExists();
    const blockBlobClient = containerClient.getBlockBlobClient(params.key);
    await blockBlobClient.uploadData(params.buffer, {
      blobHTTPHeaders: { blobContentType: params.mimeType },
    });
    return params.key;
  }

  async getSignedUrl(key: string): Promise<string> {
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blobClient = containerClient.getBlobClient(key);

    // Generate SAS token valid for 1 hour
    const expiresOn = new Date(Date.now() + 60 * 60 * 1000);
    const sasUrl = await blobClient.generateSasUrl({
      permissions: BlobSASPermissions.parse('r'),
      expiresOn,
    });

    return sasUrl;
  }

  async delete(key: string): Promise<void> {
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blobClient = containerClient.getBlobClient(key);
    await blobClient.deleteIfExists();
  }

  async getStream(key: string): Promise<Readable> {
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blobClient = containerClient.getBlobClient(key);

    const exists = await blobClient.exists();
    if (!exists) {
      throw new NotFoundException('Fișierul nu a fost găsit');
    }

    const downloadResponse = await blobClient.download();
    return downloadResponse.readableStreamBody as Readable;
  }
}
