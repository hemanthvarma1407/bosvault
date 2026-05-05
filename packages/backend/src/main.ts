import 'module-alias/register';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envName = process.env.NODE_ENV === 'production' ? 'live' : 'dev';
dotenv.config({ path: path.resolve(process.cwd(), `documents/environments/${envName}.env`), override: true });

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import "reflect-metadata";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = ['*'];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });

  app.setGlobalPrefix('api');

  (app.getHttpAdapter().getInstance() as any).set('trust proxy', true);

  // Swagger Configuration (for REST API documentation)
  const config = new DocumentBuilder()
    .setTitle('BosVault')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'BosVault',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}`);
  Logger.log(`📚 Swagger documentation available at: http://localhost:${port}/docs`);
}

bootstrap();
