import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { SparepartsModule } from './spareparts/spareparts.module';

@Module({
  imports: [PrismaModule, WarehousesModule, SparepartsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
