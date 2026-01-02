import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ICreateWarehouse,
  IWarehouse,
  IWarehouseRepository,
} from './interfaces/warehouse.interface';

@Injectable()
export class WarehousesRepository implements IWarehouseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: ICreateWarehouse): Promise<IWarehouse> {
    const warehouse = await this.prisma.warehouse.create({
      data,
    });
    return warehouse as IWarehouse;
  }

  async findAll(): Promise<IWarehouse[]> {
    const warehouses = await this.prisma.warehouse.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return warehouses as IWarehouse[];
  }

  async findById(id: string): Promise<IWarehouse | null> {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
    });
    return warehouse as IWarehouse | null;
  }

  async findByCode(code: string): Promise<IWarehouse | null> {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { code },
    });
    return warehouse as IWarehouse | null;
  }
}
