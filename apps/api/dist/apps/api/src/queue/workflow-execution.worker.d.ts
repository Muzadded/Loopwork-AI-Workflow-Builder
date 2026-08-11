import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { QueueService } from './queue.service';
export declare class WorkflowExecutionWorker implements OnModuleInit, OnModuleDestroy {
    private readonly redisService;
    private readonly queueService;
    private readonly logger;
    private worker;
    constructor(redisService: RedisService, queueService: QueueService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
