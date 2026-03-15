import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
  NotFoundException,
} from '@nestjs/common';
import { ProblemsService } from './problems.service';
import {
  CreateProblemDto,
  UpdateProblemDto,
  UpdateFieldDto,
} from './dto/create-problem.dto';
import { SyncField } from './problems.types';

@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string = 'default') {
    return this.problemsService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const problem = this.problemsService.findOne(id);
    if (!problem) {
      throw new NotFoundException(`Problem ${id} not found`);
    }
    return problem;
  }

  @Post()
  create(
    @Headers('x-tenant-id') tenantId: string = 'default',
    @Body() dto: CreateProblemDto,
  ) {
    return this.problemsService.create(tenantId, dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProblemDto) {
    return this.problemsService.update(id, dto);
  }

  @Patch(':id/field')
  updateField(@Param('id') id: string, @Body() dto: UpdateFieldDto) {
    return this.problemsService.updateField(
      id,
      dto.field as SyncField,
      dto.value,
    );
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    this.problemsService.delete(id);
    return { success: true };
  }
}
