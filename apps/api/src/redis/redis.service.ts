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
    const allowMock =
      !isProduction &&
      (this.configService.get<string>('REDIS_MOCK') === 'true' ||
        process.env.RUN_MODE !== 'worker');

    try {
      this.redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        retryStrategy(times) {
          if (times > 5) return null;
          return Math.min(times * 200, 2000);
        },
      });

      this.redisClient.on('error', (err) => {
        if (!this.isMock) {
          this.logger.error(`Redis connection error: ${err.message}`);
        }
      });

      await this.redisClient.ping();
      this.logger.log('Successfully connected to Redis instance');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      if (isProduction) {
        throw new Error(`Redis is required in production but connection failed: ${message}`);
      }

      if (!allowMock) {
        throw new Error(
          `Redis connection failed: ${message}. Start Redis or set REDIS_MOCK=true for local dev.`,
        );
      }

      this.logger.warn(`Failed to connect to Redis at ${redisUrl}. Using in-memory mock (dev only).`);
      this.switchToMock();
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
