import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getCorsOrigins, logStartupEnv, validateProductionEnv } from './config/env';

async function bootstrap() {
  validateProductionEnv();
  logStartupEnv();

  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: getCorsOrigins(),
    credentials: true,
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
