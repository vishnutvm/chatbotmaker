# Storage Architecture

**Last Updated:** 2026-07-07

---

## Overview

File storage uses **Supabase Storage** for MVP, accessed through a `StorageProvider` abstraction to allow future migration to AWS S3 without rewriting business logic.

---

## StorageProvider Interface

```typescript
interface StorageProvider {
  upload(path: string, file: Buffer, options: UploadOptions): Promise<StorageObject>;
  download(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
  getSignedUrl(path: string, expiresInSeconds: number): Promise<string>;
  exists(path: string): Promise<boolean>;
  validateFile(file: Buffer, mimeType: string, maxBytes: number): void;
}
```

Implementation: `SupabaseStorageProvider` in `apps/api/src/infrastructure/storage/`.

---

## Tenant-Aware Paths

```text
organizations/{organizationId}/
  knowledge/{knowledgeBaseId}/{documentId}/{filename}
  assistants/{assistantId}/avatar.{ext}
  exports/{exportId}.{ext}
```

Rules:
- Paths always include `organizationId`
- Never accept full path from client without authorization check
- Generate secure filenames (UUID-based) to prevent path traversal

---

## Supported File Types (Knowledge — Phase 5)

| Type | MIME | Max Size (MVP) |
|------|------|----------------|
| PDF | application/pdf | 10 MB |
| DOCX | application/vnd.openxmlformats-officedocument.wordprocessingml.document | 10 MB |
| TXT | text/plain | 5 MB |
| Markdown | text/markdown | 5 MB |

Validation in `validateFile()` before upload.

---

## Authorization

1. NestJS verifies user membership in organization
2. Storage path constructed server-side
3. Signed URLs generated only after authorization check
4. Signed URL TTL: 15 minutes (configurable)

---

## Supabase Storage Buckets

| Bucket | Access | Purpose |
|--------|--------|---------|
| `knowledge` | Private | Document uploads |
| `avatars` | Private | Assistant avatars |
| `exports` | Private | Data exports |

RLS policies on storage objects enforce organization isolation when using direct Supabase access.

---

## Future: S3StorageProvider

Introduce when:
- Storage egress costs exceed threshold
- Enterprise customers require S3-compatible storage
- Multi-region replication needed

Migration: copy objects bucket-to-bucket; update `STORAGE_PROVIDER=s3` env var.
