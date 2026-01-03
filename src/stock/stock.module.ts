import { Module } from '@nestjs/common';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { StockRepository } from './stock.repository';
import { WarehousesModule } from '../warehouses/warehouses.module';
import { SparepartsModule } from '../spareparts/spareparts.module';

@Module({
  imports: [WarehousesModule, SparepartsModule],
  controllers: [StockController],
  providers: [StockService, StockRepository],
  exports: [StockService, StockRepository],
})
export class StockModule {}
