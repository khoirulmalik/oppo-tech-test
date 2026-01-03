import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockRepository } from './stock.repository';
import { WarehousesRepository } from '../warehouses/warehouses.repository';
import { SparepartsRepository } from '../spareparts/spareparts.repository';
import {
  StockInDto,
  StockOutDto,
  WarehouseStockResponseDto,
  StockTransactionResponseDto,
} from './dto';
import { STOCK_ERROR_MESSAGES } from './constants';
import { TransactionType } from '@prisma/client';

@Injectable()
export class StockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockRepository: StockRepository,
    private readonly warehouseRepository: WarehousesRepository,
    private readonly sparepartRepository: SparepartsRepository,
  ) {}

  async stockIn(stockInDto: StockInDto): Promise<StockTransactionResponseDto> {
    const { warehouseId, sparepartId, quantity } = stockInDto;

    // Validate warehouse exists
    const warehouse = await this.warehouseRepository.findById(warehouseId);
    if (!warehouse) {
      throw new NotFoundException(
        STOCK_ERROR_MESSAGES.WAREHOUSE_NOT_FOUND(warehouseId),
      );
    }

    // Validate sparepart exists
    const sparepart = await this.sparepartRepository.findById(sparepartId);
    if (!sparepart) {
      throw new NotFoundException(
        STOCK_ERROR_MESSAGES.SPAREPART_NOT_FOUND(sparepartId),
      );
    }

    // Validate quantity
    if (quantity <= 0) {
      throw new BadRequestException(STOCK_ERROR_MESSAGES.INVALID_QUANTITY);
    }

    const transaction = await this.prisma.$transaction(async (tx) => {
      const stockRows = await tx.$queryRawUnsafe<
        Array<{
          id: string;
          warehouse_id: string;
          sparepart_id: string;
          current_stock: number;
          updated_at: Date;
        }>
      >(
        `SELECT * FROM warehouse_stocks WHERE warehouse_id = $1 AND sparepart_id = $2 FOR UPDATE`,
        warehouseId,
        sparepartId,
      );

      let stock;
      if (stockRows.length > 0) {
        // Update existing stock
        const existingStock = stockRows[0];
        stock = await tx.warehouseStock.update({
          where: { id: existingStock.id },
          data: { currentStock: existingStock.current_stock + quantity },
        });
      } else {
        // Create new stock entry if doesn't exist
        stock = await tx.warehouseStock.create({
          data: {
            warehouseId,
            sparepartId,
            currentStock: quantity,
          },
        });
      }

      // Create transaction record
      const stockTransaction = await tx.stockTransaction.create({
        data: {
          warehouseId,
          sparepartId,
          type: TransactionType.IN,
          quantity,
        },
      });

      return stockTransaction;
    });

    return new StockTransactionResponseDto(transaction);
  }

  async stockOut(
    stockOutDto: StockOutDto,
  ): Promise<StockTransactionResponseDto> {
    const { warehouseId, sparepartId, quantity } = stockOutDto;

    // Validate warehouse exists
    const warehouse = await this.warehouseRepository.findById(warehouseId);
    if (!warehouse) {
      throw new NotFoundException(
        STOCK_ERROR_MESSAGES.WAREHOUSE_NOT_FOUND(warehouseId),
      );
    }

    // Validate sparepart exists
    const sparepart = await this.sparepartRepository.findById(sparepartId);
    if (!sparepart) {
      throw new NotFoundException(
        STOCK_ERROR_MESSAGES.SPAREPART_NOT_FOUND(sparepartId),
      );
    }

    // Validate quantity
    if (quantity <= 0) {
      throw new BadRequestException(STOCK_ERROR_MESSAGES.INVALID_QUANTITY);
    }

    // Use transaction with locking for stock OUT
    const transaction = await this.prisma.$transaction(async (tx) => {
      const stockRows = await tx.$queryRawUnsafe<
        Array<{
          id: string;
          warehouse_id: string;
          sparepart_id: string;
          current_stock: number;
          updated_at: Date;
        }>
      >(
        `SELECT * FROM warehouse_stocks WHERE warehouse_id = $1 AND sparepart_id = $2 FOR UPDATE`,
        warehouseId,
        sparepartId,
      );

      // Check if stock exists
      if (stockRows.length === 0) {
        throw new NotFoundException(
          STOCK_ERROR_MESSAGES.STOCK_NOT_FOUND(warehouseId, sparepartId),
        );
      }

      const existingStock = stockRows[0];
      const currentStock = existingStock.current_stock;

      // Validate sufficient stock
      if (currentStock < quantity) {
        throw new BadRequestException(
          STOCK_ERROR_MESSAGES.INSUFFICIENT_STOCK(currentStock, quantity),
        );
      }

      // Update stock (reduce)
      await tx.warehouseStock.update({
        where: { id: existingStock.id },
        data: { currentStock: currentStock - quantity },
      });

      // Create transaction record
      const stockTransaction = await tx.stockTransaction.create({
        data: {
          warehouseId,
          sparepartId,
          type: TransactionType.OUT,
          quantity,
        },
      });

      return stockTransaction;
    });

    return new StockTransactionResponseDto(transaction);
  }

  async getStock(
    warehouseId: string,
    sparepartId: string,
  ): Promise<WarehouseStockResponseDto> {
    const stock = await this.stockRepository.findStock(
      warehouseId,
      sparepartId,
    );

    if (!stock) {
      throw new NotFoundException(
        STOCK_ERROR_MESSAGES.STOCK_NOT_FOUND(warehouseId, sparepartId),
      );
    }

    return new WarehouseStockResponseDto(stock);
  }

  async getStockHistory(
    warehouseId?: string,
    sparepartId?: string,
  ): Promise<StockTransactionResponseDto[]> {
    const transactions = await this.stockRepository.getStockHistory(
      warehouseId,
      sparepartId,
    );

    return transactions.map(
      (transaction) => new StockTransactionResponseDto(transaction),
    );
  }
}
