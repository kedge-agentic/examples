import { Controller, Get, Param, Query } from '@nestjs/common';
import { PoliciesService } from './policies.service';

@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('region') region?: string,
    @Query('crop_type') cropType?: string,
  ) {
    return this.policiesService.findAll({ category, region, crop_type: cropType });
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.policiesService.findById(id);
  }
}
