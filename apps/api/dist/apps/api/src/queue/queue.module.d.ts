import { DynamicModule } from '@nestjs/common';
export declare class QueueModule {
    static forApi(): DynamicModule;
    static forWorker(): DynamicModule;
}
