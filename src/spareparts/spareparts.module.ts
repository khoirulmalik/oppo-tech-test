import { Module } from '@nestjs/common';
import { SparepartsController } from './spareparts.controller';
import { SparepartsService } from './spareparts.service';
import { SparepartsRepository } from './spareparts.repository';

@Module({
  controllers: [SparepartsController],
  providers: [SparepartsService, SparepartsRepository],
  exports: [SparepartsService, SparepartsRepository],
})
export class SparepartsModule {}
