import { Module } from '@nestjs/common';
import { ExplanationsService } from './explanations.service';
import { ExplanationsController } from './explanations.controller';

@Module({
  controllers: [ExplanationsController],
  providers: [ExplanationsService],
  exports: [ExplanationsService],
})
export class ExplanationsModule {}
