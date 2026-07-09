export interface UploadOptions {
  contentType: string;
  maxBytes?: number;
}

export interface StorageObject {
  path: string;
  size: number;
  contentType: string;
}

export interface StorageProvider {
  upload(path: string, file: Buffer, options: UploadOptions): Promise<StorageObject>;
  download(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
  getSignedUrl(path: string, expiresInSeconds: number): Promise<string>;
  exists(path: string): Promise<boolean>;
  validateFile(file: Buffer, mimeType: string, maxBytes: number): void;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
