import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiUsage } from './ai-usage.entity';
import { AiUsageService } from './ai-usage.service';
import { AiLimitGuard } from './ai-limit.guard';

@Module({
  imports: [TypeOrmModule.forFeature([AiUsage])],
  providers: [AiUsageService, AiLimitGuard],
  exports: [AiUsageService, AiLimitGuard],
})
export class AiUsageModule {}
