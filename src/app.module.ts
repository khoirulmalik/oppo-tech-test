import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { SparepartsModule } from './spareparts/spareparts.module';
import { StockModule } from './stock/stock.module';

@Module({
  imports: [PrismaModule, WarehousesModule, SparepartsModule, StockModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
