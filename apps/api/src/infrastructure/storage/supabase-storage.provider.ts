import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getRequiredEnv } from '../../config/env';
import type { StorageObject, StorageProvider, UploadOptions } from './storage.interface';

const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

@Injectable()
export class SupabaseStorageProvider implements StorageProvider {
  private readonly client: SupabaseClient;
  private readonly defaultBucket: string;

  constructor() {
    this.client = createClient(getRequiredEnv('SUPABASE_URL'), getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'));
    this.defaultBucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'knowledge';
  }

  validateFile(file: Buffer, mimeType: string, maxBytes: number = DEFAULT_MAX_BYTES): void {
    if (file.length > maxBytes) {
      throw new Error(`File exceeds maximum size of ${maxBytes} bytes`);
    }
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new Error(`MIME type not allowed: ${mimeType}`);
    }
  }

  async upload(path: string, file: Buffer, options: UploadOptions): Promise<StorageObject> {
    this.validateFile(file, options.contentType, options.maxBytes ?? DEFAULT_MAX_BYTES);

    const { error } = await this.client.storage.from(this.defaultBucket).upload(path, file, {
      contentType: options.contentType,
      upsert: false,
    });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    return { path, size: file.length, contentType: options.contentType };
  }

  async download(path: string): Promise<Buffer> {
    const { data, error } = await this.client.storage.from(this.defaultBucket).download(path);
    if (error || !data) {
      throw new Error(`Storage download failed: ${error?.message ?? 'not found'}`);
    }
    return Buffer.from(await data.arrayBuffer());
  }

  async delete(path: string): Promise<void> {
    const { error } = await this.client.storage.from(this.defaultBucket).remove([path]);
    if (error) {
      throw new Error(`Storage delete failed: ${error.message}`);
    }
  }

  async getSignedUrl(path: string, expiresInSeconds: number): Promise<string> {
    const { data, error } = await this.client.storage
      .from(this.defaultBucket)
      .createSignedUrl(path, expiresInSeconds);
    if (error || !data?.signedUrl) {
      throw new Error(`Signed URL failed: ${error?.message ?? 'unknown'}`);
    }
    return data.signedUrl;
  }

  async exists(path: string): Promise<boolean> {
    const parts = path.split('/');
    const fileName = parts.pop();
    const folder = parts.join('/');
    if (!fileName) return false;

    const { data, error } = await this.client.storage.from(this.defaultBucket).list(folder, {
      search: fileName,
    });
    if (error) return false;
    return data.some((item) => item.name === fileName);
  }
}
