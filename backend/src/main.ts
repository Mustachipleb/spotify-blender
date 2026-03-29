import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);

  const logger = new Logger();
  app.useLogger(logger);

  logger.log(
    [
      configService.getOrThrow('FRONTEND_URL'),
      configService.getOrThrow('URL'),
    ].filter(Boolean),
  );

  app.enableCors({
    origin: [
      configService.getOrThrow('FRONTEND_URL'),
      configService.getOrThrow('URL'),
    ].filter(Boolean),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Accept,Authorization',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
