import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient!: Redis;
  private isMock = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
    const isProduction = process.env.NODE_ENV === 'production';
    const runMode = this.configService.get<string>('RUN_MODE', 'api');
    const redisMockEnv = this.configService.get<string>('REDIS_MOCK', 'false');
    const forceMock = !isProduction && redisMockEnv === 'true';
    const allowMock = !isProduction && (forceMock || runMode !== 'worker');

    if (forceMock) {
      this.logger.log('REDIS_MOCK=true — using in-memory Redis (dev only).');
      this.switchToMock();
      return;
    }

    const connected = await this.tryConnectReal(redisUrl);
    if (connected) {
      this.logger.log('Successfully connected to Redis instance');
      return;
    }

    if (isProduction) {
      throw new Error(`Redis is required in production but connection to ${redisUrl} failed.`);
    }

    if (!allowMock) {
      throw new Error(
        `Redis connection failed. Start Redis (docker compose up -d) or set REDIS_MOCK=true for local dev.`,
      );
    }

    this.logger.warn(`Redis unavailable at ${redisUrl}. Using in-memory mock (dev only).`);
    this.switchToMock();
  }

  /** Single quick attempt — avoids noisy retry/error spam when Redis is down. */
  private async tryConnectReal(redisUrl: string): Promise<boolean> {
    const probe = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 1500,
      retryStrategy: () => null,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    try {
      await probe.connect();
      await probe.ping();

      probe.on('error', (err) => {
        if (!this.isMock) {
          this.logger.error(`Redis connection error: ${err.message}`);
        }
      });

      this.redisClient = probe;
      return true;
    } catch {
      probe.disconnect();
      return false;
    }
  }

  private switchToMock() {
    this.isMock = true;
    this.redisClient = new RedisMock() as unknown as Redis;
    this.logger.log('Initialized in-memory Redis mock client');
  }

  getClient(): Redis {
    return this.redisClient;
  }

  isUsingRealClient(): boolean {
    return !this.isMock;
  }

  async isHealthy(): Promise<boolean> {
    if (this.isMock) return false;

    try {
      const res = await this.redisClient.ping();
      return res === 'PONG';
    } catch {
      return false;
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}
