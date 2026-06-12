import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // Necesario para leer la IP real detrás de proxies (Render, Vercel)
  app.getHttpAdapter().getInstance().set('trust proxy', true);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
