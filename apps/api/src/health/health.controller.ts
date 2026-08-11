import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { HealthCheckResponse } from '@repo/shared-types';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  async check(): Promise<HealthCheckResponse> {
    const postgresHealthy = await this.prismaService.isHealthy();
    const redisConnected = this.redisService.isUsingRealClient() && (await this.redisService.isHealthy());

    const isAllOk = postgresHealthy && redisConnected;

    return {
      status: isAllOk ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      postgres: postgresHealthy ? 'connected' : 'disconnected',
      redis: redisConnected ? 'connected' : 'disconnected',
    };
  }
}
