import { Global, Module } from '@nestjs/common';
import { CACHE_PROVIDER } from './cache.interface';
import { MemoryCacheProvider } from './memory-cache.provider';

@Global()
@Module({
  providers: [
    MemoryCacheProvider,
    {
      provide: CACHE_PROVIDER,
      useExisting: MemoryCacheProvider,
    },
  ],
  exports: [CACHE_PROVIDER, MemoryCacheProvider],
})
export class CacheModule {}
