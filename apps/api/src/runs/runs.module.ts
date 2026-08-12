import { Module } from '@nestjs/common';
import { RunsController } from './runs.controller';
import { DashboardController } from './dashboard.controller';
import { RunsCoreModule } from './runs-core.module';

@Module({
  imports: [RunsCoreModule],
  controllers: [RunsController, DashboardController],
})
export class RunsModule {}
