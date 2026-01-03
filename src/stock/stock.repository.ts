import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';
import {
  IStockRepository,
  IWarehouseStock,
  IStockTransaction,
} from './interfaces';

@Injectable()
export class StockRepository implements IStockRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findStock(
    warehouseId: string,
    sparepartId: string,
  ): Promise<IWarehouseStock | null> {
    const stock = await this.prisma.warehouseStock.findUnique({
      where: {
        warehouseId_sparepartId: {
          warehouseId,
          sparepartId,
        },
      },
    });
    return stock as IWarehouseStock | null;
  }

  async findStockWithLock(
    warehouseId: string,
    sparepartId: string,
  ): Promise<IWarehouseStock | null> {
    const stock = await this.prisma.$queryRaw<IWarehouseStock[]>`
      SELECT * FROM warehouse_stocks
      WHERE warehouse_id = ${warehouseId}::uuid
      AND sparepart_id = ${sparepartId}::uuid
      FOR UPDATE
    `;

    if (stock.length === 0) {
      return null;
    }

    const result = stock[0];
    return {
      id: result.id,
      warehouseId: result['warehouse_id' as keyof typeof result] as string,
      sparepartId: result['sparepart_id' as keyof typeof result] as string,
      currentStock: result['current_stock' as keyof typeof result] as number,
      updatedAt: result['updated_at' as keyof typeof result] as Date,
      createdAt: new Date(),
    } as IWarehouseStock;
  }

  async createStock(data: {
    warehouseId: string;
    sparepartId: string;
    currentStock: number;
  }): Promise<IWarehouseStock> {
    const stock = await this.prisma.warehouseStock.create({
      data,
    });
    return stock as IWarehouseStock;
  }

  async updateStock(
    id: string,
    currentStock: number,
  ): Promise<IWarehouseStock> {
    const stock = await this.prisma.warehouseStock.update({
      where: { id },
      data: { currentStock },
    });
    return stock as IWarehouseStock;
  }

  async createTransaction(data: {
    warehouseId: string;
    sparepartId: string;
    type: TransactionType;
    quantity: number;
  }): Promise<IStockTransaction> {
    const transaction = await this.prisma.stockTransaction.create({
      data,
    });
    return transaction as IStockTransaction;
  }

  async getStockHistory(
    warehouseId?: string,
    sparepartId?: string,
  ): Promise<IStockTransaction[]> {
    const transactions = await this.prisma.stockTransaction.findMany({
      where: {
        ...(warehouseId && { warehouseId }),
        ...(sparepartId && { sparepartId }),
      },
      orderBy: { createdAt: 'desc' },
    });
    return transactions as IStockTransaction[];
  }
}
