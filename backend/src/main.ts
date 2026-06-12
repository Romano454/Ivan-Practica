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
  // 1 = confiar solo en el primer proxy (Render); req.ip resuelve la IP real del cliente
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
