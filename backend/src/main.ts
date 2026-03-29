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

  if (
    configService.get('NODE_ENV') === 'production' &&
    configService.getOrThrow('DISABLE_CORS') !== 'true'
  ) {
    app.enableCors({
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => {
        const allowedOrigins = [
          configService.getOrThrow('FRONTEND_URL'),
          configService.getOrThrow('URL'),
        ].filter(Boolean);
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      allowedHeaders: 'Content-Type,Accept,Authorization',
      credentials: true,
    });
  }
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
