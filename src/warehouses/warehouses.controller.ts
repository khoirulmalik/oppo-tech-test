import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { WarehouseResponseDto } from './dto/warehouse-response.dto';

@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  async create(
    @Body() createWarehouseDto: CreateWarehouseDto,
  ): Promise<WarehouseResponseDto> {
    return this.warehousesService.create(createWarehouseDto);
  }

  @Get()
  async findAll(): Promise<WarehouseResponseDto[]> {
    return this.warehousesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<WarehouseResponseDto> {
    return this.warehousesService.findOne(id);
  }
}
