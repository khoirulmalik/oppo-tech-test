import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { WarehousesModule } from './warehouses/warehouses.module';

@Module({
  imports: [PrismaModule, WarehousesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
