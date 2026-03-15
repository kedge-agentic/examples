import { Controller, Get, Param } from '@nestjs/common';
import { FarmersService } from './farmers.service';

@Controller('farmers')
export class FarmersController {
  constructor(private readonly farmersService: FarmersService) {}

  @Get()
  findAll() {
    return this.farmersService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.farmersService.findById(id);
  }

  @Get('phone/:phone')
  findByPhone(@Param('phone') phone: string) {
    return this.farmersService.findByPhone(phone);
  }

  @Get(':id/land')
  getLandParcels(@Param('id') id: string) {
    return this.farmersService.getLandParcels(id);
  }

  @Get(':id/crops')
  getCropRecords(@Param('id') id: string) {
    return this.farmersService.getCropRecords(id);
  }

  @Get(':id/equipment')
  getEquipment(@Param('id') id: string) {
    return this.farmersService.getEquipment(id);
  }

  @Get(':id/loans')
  getLoanHistory(@Param('id') id: string) {
    return this.farmersService.getLoanHistory(id);
  }

  @Get(':id/summary')
  getSummary(@Param('id') id: string) {
    return this.farmersService.getSummary(id);
  }
}
