import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { FarmersModule } from './farmers/farmers.module';
import { PoliciesModule } from './policies/policies.module';
import { LoanProductsModule } from './loan-products/loan-products.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    FarmersModule,
    PoliciesModule,
    LoanProductsModule,
  ],
})
export class AppModule {}
