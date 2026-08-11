"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
const ioredis_mock_1 = __importDefault(require("ioredis-mock"));
let RedisService = RedisService_1 = class RedisService {
    configService;
    logger = new common_1.Logger(RedisService_1.name);
    redisClient;
    isMock = false;
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        const redisUrl = this.configService.get('REDIS_URL', 'redis://localhost:6379');
        const isProduction = process.env.NODE_ENV === 'production';
        const allowMock = !isProduction &&
            (this.configService.get('REDIS_MOCK') === 'true' ||
                process.env.RUN_MODE !== 'worker');
        try {
            this.redisClient = new ioredis_1.default(redisUrl, {
                maxRetriesPerRequest: null,
                retryStrategy(times) {
                    if (times > 5)
                        return null;
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
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            if (isProduction) {
                throw new Error(`Redis is required in production but connection failed: ${message}`);
            }
            if (!allowMock) {
                throw new Error(`Redis connection failed: ${message}. Start Redis or set REDIS_MOCK=true for local dev.`);
            }
            this.logger.warn(`Failed to connect to Redis at ${redisUrl}. Using in-memory mock (dev only).`);
            this.switchToMock();
        }
    }
    switchToMock() {
        this.isMock = true;
        this.redisClient = new ioredis_mock_1.default();
        this.logger.log('Initialized in-memory Redis mock client');
    }
    getClient() {
        return this.redisClient;
    }
    isUsingRealClient() {
        return !this.isMock;
    }
    async isHealthy() {
        if (this.isMock)
            return false;
        try {
            const res = await this.redisClient.ping();
            return res === 'PONG';
        }
        catch {
            return false;
        }
    }
    async onModuleDestroy() {
        if (this.redisClient) {
            await this.redisClient.quit();
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map