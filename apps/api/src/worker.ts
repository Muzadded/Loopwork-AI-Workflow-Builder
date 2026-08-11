import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerAppModule } from './worker-app.module';

async function bootstrap() {
  process.env.RUN_MODE = 'worker';

  const logger = new Logger('WorkerBootstrap');
  const app = await NestFactory.createApplicationContext(WorkerAppModule);

  logger.log('BullMQ worker process started (RUN_MODE=worker)');

  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}, shutting down worker...`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap();
