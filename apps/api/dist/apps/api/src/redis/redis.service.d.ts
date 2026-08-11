import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private redisClient;
    private isMock;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    private switchToMock;
    getClient(): Redis;
    isUsingRealClient(): boolean;
    isHealthy(): Promise<boolean>;
    onModuleDestroy(): Promise<void>;
}
