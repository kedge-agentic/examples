import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { ExplanationsService } from './explanations.service';
import { SyncField } from '../problems/problems.types';

class UpdateFieldDto {
  field: string;
  value: unknown;
}

@Controller('explanations')
export class ExplanationsController {
  constructor(private readonly explanationsService: ExplanationsService) {}

  @Get('problem/:problemId')
  findByProblemId(@Param('problemId') problemId: string) {
    const explanation = this.explanationsService.findByProblemId(problemId);
    return explanation || { problemId, exists: false };
  }

  @Post('problem/:problemId')
  getOrCreate(@Param('problemId') problemId: string) {
    return this.explanationsService.getOrCreate(problemId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const explanation = this.explanationsService.findOne(id);
    if (!explanation) {
      throw new NotFoundException('Explanation not found');
    }
    return explanation;
  }

  @Patch(':id/field')
  updateField(@Param('id') id: string, @Body() dto: UpdateFieldDto) {
    return this.explanationsService.updateField(
      id,
      dto.field as SyncField,
      dto.value,
    );
  }
}
