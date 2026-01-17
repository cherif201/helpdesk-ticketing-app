import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  console.log('Mailer service started');
  console.log(`Polling interval: ${process.env.POLL_INTERVAL_MS || 5000}ms`);
  console.log(`SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
}

bootstrap();
