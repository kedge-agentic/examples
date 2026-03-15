import { Controller, Get, Param, Query } from '@nestjs/common';
import { LoanProductsService } from './loan-products.service';

@Controller('loan-products')
export class LoanProductsController {
  constructor(private readonly loanProductsService: LoanProductsService) {}

  @Get()
  findAll(
    @Query('bank_name') bankName?: string,
    @Query('max_amount') maxAmount?: string,
  ) {
    return this.loanProductsService.findAll({
      bank_name: bankName,
      max_amount: maxAmount ? parseFloat(maxAmount) : undefined,
    });
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.loanProductsService.findById(id);
  }
}
