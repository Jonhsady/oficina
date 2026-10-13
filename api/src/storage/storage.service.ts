import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, resolve, sep } from 'path';
import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Inject, Injectable, NotFoundException, type OnModuleInit } from '@nestjs/common';
import { CONFIG, type AppConfig } from '../config';

@Injectable()
export class StorageService implements OnModuleInit {
  private client: S3Client | null = null;
  private bucket = '';

  constructor(@Inject(CONFIG) private readonly config: AppConfig) {}

  get mode(): 's3' | 'disk' {
    return this.config.s3 ? 's3' : 'disk';
  }

  async onModuleInit() {
    if (!this.config.s3) {
      await mkdir(this.config.uploadDir, { recursive: true });
      return;
    }

    this.bucket = this.config.s3.bucket;
    this.client = new S3Client({
      region: this.config.s3.region,
      endpoint: this.config.s3.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.config.s3.accessKey,
        secretAccessKey: this.config.s3.secretKey,
      },
    });

    let lastError: unknown;
    for (let attempt = 1; attempt <= 20; attempt += 1) {
      try {
        await this.ensureBucket();
        return;
      } catch (error) {
        lastError = error;
        await new Promise((resolveDelay) => setTimeout(resolveDelay, 1000));
      }
    }
    throw lastError;
  }

  async put(key: string, body: Buffer, contentType: string) {
    if (this.client) {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
      return;
    }

    const target = this.localPath(key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, body);
  }

  async get(key: string): Promise<Buffer> {
    if (this.client) {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      const bytes = await result.Body?.transformToByteArray();
      if (!bytes) throw new NotFoundException('Arquivo não encontrado');
      return Buffer.from(bytes);
    }

    try {
      return await readFile(this.localPath(key));
    } catch {
      throw new NotFoundException('Arquivo não encontrado');
    }
  }

  private async ensureBucket() {
    if (!this.client) return;
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }

  private localPath(key: string) {
    if (!key.startsWith('orders/') || key.includes('..')) {
      throw new NotFoundException('Arquivo não encontrado');
    }
    const root = resolve(this.config.uploadDir);
    const target = resolve(root, key);
    if (!target.startsWith(`${root}${sep}`)) {
      throw new NotFoundException('Arquivo não encontrado');
    }
    return target;
  }
}
