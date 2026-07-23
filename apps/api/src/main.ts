import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Request } from 'express';
import { AppModule } from './app.module';
import { isPublicApiPath } from './config/cors-public-path';
import { getCorsOrigins, logStartupEnv, validateProductionEnv } from './config/env';

async function bootstrap() {
  validateProductionEnv();
  logStartupEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();
  // One hop (Railway/reverse proxy) so req.ip is the client for public chat IP rate limits.
  app.set('trust proxy', 1);

  app.setGlobalPrefix('api/v1', { exclude: ['health', 'version'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const dashboardOrigins = getCorsOrigins();
  app.enableCors((req: Request, callback) => {
    if (isPublicApiPath(req)) {
      // Third-party embeds: reflect origin, no credentials.
      callback(null, {
        origin: true,
        credentials: false,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Genie-Public-Key'],
        methods: ['GET', 'POST', 'OPTIONS'],
      });
      return;
    }
    callback(null, {
      origin: dashboardOrigins,
      credentials: true,
    });
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
