import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { loadConfig } from './config';

export function configureApp(app: INestApplication) {
  const config = loadConfig();
  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: config.corsOrigin });

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Oficina API')
      .setDescription('Ordens de serviço com máquina de estados, autenticação e tempo real.')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('api/docs', app, document);
  return config;
}
