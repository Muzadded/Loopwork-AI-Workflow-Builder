import { Module, forwardRef } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ApprovalsModule } from '../approvals/approvals.module';
import { TriggerNodeExecutor } from './nodes/trigger-node.executor';
import { LlmNodeExecutor } from './nodes/llm-node.executor';
import { ConditionNodeExecutor } from './nodes/condition-node.executor';
import { ActionNodeExecutor } from './nodes/action-node.executor';
import { ApprovalNodeExecutor } from './nodes/approval-node.executor';
import { NodeExecutorRegistry } from './nodes/node-executor.registry';
import { WorkflowEngineService } from './workflow-engine.service';
import { EngineController } from './engine.controller';

@Module({
  imports: [AiModule, forwardRef(() => ApprovalsModule)],
  providers: [
    TriggerNodeExecutor,
    LlmNodeExecutor,
    ConditionNodeExecutor,
    ActionNodeExecutor,
    ApprovalNodeExecutor,
    NodeExecutorRegistry,
    WorkflowEngineService,
  ],
  controllers: [EngineController],
  exports: [WorkflowEngineService],
})
export class EngineModule {}
