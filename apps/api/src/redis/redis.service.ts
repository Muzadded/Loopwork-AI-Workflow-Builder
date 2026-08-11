import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: Redis;
  private isMock = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
    
    try {
      this.redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy(times) {
          if (times > 2) return null; // Stop retrying quickly to trigger fallback
          return Math.min(times * 100, 1000);
        },
      });

      this.redisClient.on('error', (err) => {
        if (!this.isMock) {
          this.logger.warn(`Redis connection error: ${err.message}. Switching to mock client for dev health.`);
          this.switchToMock();
        }
      });

      await this.redisClient.ping();
      this.logger.log('Successfully connected to Redis instance');
    } catch (err) {
      this.logger.warn(`Failed to connect to Redis at ${redisUrl}. Using mock instance.`);
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
