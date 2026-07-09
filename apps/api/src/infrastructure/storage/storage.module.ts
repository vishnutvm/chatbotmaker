import { Global, Module } from '@nestjs/common';
import { STORAGE_PROVIDER } from './storage.interface';
import { SupabaseStorageProvider } from './supabase-storage.provider';

@Global()
@Module({
  providers: [
    SupabaseStorageProvider,
    {
      provide: STORAGE_PROVIDER,
      useExisting: SupabaseStorageProvider,
    },
  ],
  exports: [STORAGE_PROVIDER, SupabaseStorageProvider],
})
export class StorageModule {}
