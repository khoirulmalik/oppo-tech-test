import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { WarehouseResponseDto } from './dto/warehouse-response.dto';

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createWarehouseDto: CreateWarehouseDto,
  ): Promise<WarehouseResponseDto> {
    const existingWarehouse = await this.prisma.warehouse.findUnique({
      where: { code: createWarehouseDto.code },
    });

    if (existingWarehouse) {
      throw new ConflictException(
        `Warehouse with code ${createWarehouseDto.code} already exists`,
      );
    }

    const warehouse = await this.prisma.warehouse.create({
      data: createWarehouseDto,
    });

    return new WarehouseResponseDto(warehouse);
  }

  async findAll(): Promise<WarehouseResponseDto[]> {
    const warehouses = await this.prisma.warehouse.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return warehouses.map((warehouse) => new WarehouseResponseDto(warehouse));
  }

  async findOne(id: string): Promise<WarehouseResponseDto> {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    return new WarehouseResponseDto(warehouse);
  }
}
