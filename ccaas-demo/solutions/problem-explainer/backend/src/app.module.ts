import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ProblemsModule } from './problems/problems.module';
import { ExplanationsModule } from './explanations/explanations.module';
import { KnowledgePointsModule } from './knowledge-points/knowledge-points.module';
import { SessionsModule } from './sessions/sessions.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    ProblemsModule,
    ExplanationsModule,
    KnowledgePointsModule,
    SessionsModule,
  ],
})
export class AppModule {}
