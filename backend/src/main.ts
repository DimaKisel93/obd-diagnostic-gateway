import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { StructuredLogger } from './logger/structured-logger';
import { SWAGGER_TITLES, SWAGGER_TAGS } from './common/constants/swagger';

async function bootstrap() {
  const logger = new StructuredLogger('Bootstrap');
  const app = await NestFactory.create(AppModule, { logger });
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle(SWAGGER_TITLES.API_TITLE)
    .setDescription(SWAGGER_TITLES.API_DESCRIPTION)
    .setVersion('1.0.0')
    .addTag('health', SWAGGER_TAGS.HEALTH)
    .addTag('obd', SWAGGER_TAGS.OBD)
    .addTag('telemetry', SWAGGER_TAGS.TELEMETRY)
    .addTag('sessions', SWAGGER_TAGS.SESSIONS)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`OBD Diagnostic Gateway listening on http://localhost:${port}/api`);
  logger.log(`Swagger UI available at http://localhost:${port}/api/docs`);
  logger.log(`WebSocket telemetry endpoint: ws://localhost:${port}/telemetry`);
}
bootstrap();
