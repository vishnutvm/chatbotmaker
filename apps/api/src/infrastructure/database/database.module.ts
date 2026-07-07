import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { getMongoUri } from '../../config/env';

@Module({
  imports: [
    MongooseModule.forRoot(getMongoUri(), {
      autoIndex: process.env.NODE_ENV !== 'production',
    }),
  ],
})
export class DatabaseModule {}
