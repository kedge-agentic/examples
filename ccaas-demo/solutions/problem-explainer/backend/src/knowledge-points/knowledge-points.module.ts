import { Module } from '@nestjs/common';
import { KnowledgePointsController } from './knowledge-points.controller';
import { KnowledgePointsService } from './knowledge-points.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule],
  controllers: [KnowledgePointsController],
  providers: [KnowledgePointsService],
  exports: [KnowledgePointsService],
})
export class KnowledgePointsModule {}
