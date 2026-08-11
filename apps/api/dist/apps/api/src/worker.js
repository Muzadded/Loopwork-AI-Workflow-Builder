"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const worker_app_module_1 = require("./worker-app.module");
async function bootstrap() {
    process.env.RUN_MODE = 'worker';
    const logger = new common_1.Logger('WorkerBootstrap');
    const app = await core_1.NestFactory.createApplicationContext(worker_app_module_1.WorkerAppModule);
    logger.log('BullMQ worker process started (RUN_MODE=worker)');
    const shutdown = async (signal) => {
        logger.log(`Received ${signal}, shutting down worker...`);
        await app.close();
        process.exit(0);
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}
bootstrap();
//# sourceMappingURL=worker.js.map