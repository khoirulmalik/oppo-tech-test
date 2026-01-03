import { Test, TestingModule } from '@nestjs/testing';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import {
  StockInDto,
  StockOutDto,
  StockTransactionResponseDto,
  WarehouseStockResponseDto,
} from './dto';
import { TransactionType } from '@prisma/client';

describe('StockController', () => {
  let controller: StockController;

  const mockStockService = {
    stockIn: jest.fn(),
    stockOut: jest.fn(),
    getStock: jest.fn(),
    getStockHistory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockController],
      providers: [
        {
          provide: StockService,
          useValue: mockStockService,
        },
      ],
    }).compile();

    controller = module.get<StockController>(StockController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('stockIn', () => {
    it('should add stock successfully', async () => {
      const stockInDto: StockInDto = {
        warehouseId: 'warehouse-123',
        sparepartId: 'sparepart-123',
        quantity: 50,
      };

      const expectedResponse: StockTransactionResponseDto = {
        id: 'transaction-123',
        warehouseId: stockInDto.warehouseId,
        sparepartId: stockInDto.sparepartId,
        type: 'IN',
        quantity: stockInDto.quantity,
        createdAt: new Date(),
      };

      mockStockService.stockIn.mockResolvedValue(expectedResponse);

      const result = await controller.stockIn(stockInDto);

      expect(result).toEqual(expectedResponse);
      expect(mockStockService.stockIn).toHaveBeenCalledWith(stockInDto);
      expect(mockStockService.stockIn).toHaveBeenCalledTimes(1);
    });
  });

  describe('stockOut', () => {
    it('should remove stock successfully', async () => {
      const stockOutDto: StockOutDto = {
        warehouseId: 'warehouse-123',
        sparepartId: 'sparepart-123',
        quantity: 10,
      };

      const expectedResponse: StockTransactionResponseDto = {
        id: 'transaction-123',
        warehouseId: stockOutDto.warehouseId,
        sparepartId: stockOutDto.sparepartId,
        type: 'OUT',
        quantity: stockOutDto.quantity,
        createdAt: new Date(),
      };

      mockStockService.stockOut.mockResolvedValue(expectedResponse);

      const result = await controller.stockOut(stockOutDto);

      expect(result).toEqual(expectedResponse);
      expect(mockStockService.stockOut).toHaveBeenCalledWith(stockOutDto);
      expect(mockStockService.stockOut).toHaveBeenCalledTimes(1);
    });
  });

  describe('getStock', () => {
    it('should return stock information', async () => {
      const warehouseId = 'warehouse-123';
      const sparepartId = 'sparepart-123';

      const expectedResponse: WarehouseStockResponseDto = {
        id: 'stock-123',
        warehouseId,
        sparepartId,
        currentStock: 100,
        updatedAt: new Date(),
      };

      mockStockService.getStock.mockResolvedValue(expectedResponse);

      const result = await controller.getStock(warehouseId, sparepartId);

      expect(result).toEqual(expectedResponse);
      expect(mockStockService.getStock).toHaveBeenCalledWith(
        warehouseId,
        sparepartId,
      );
      expect(mockStockService.getStock).toHaveBeenCalledTimes(1);
    });
  });

  describe('getStockHistory', () => {
    it('should return stock history', async () => {
      const expectedTransactions: StockTransactionResponseDto[] = [
        {
          id: 'transaction-1',
          warehouseId: 'warehouse-123',
          sparepartId: 'sparepart-123',
          type: 'IN',
          quantity: 50,
          createdAt: new Date(),
        },
        {
          id: 'transaction-2',
          warehouseId: 'warehouse-123',
          sparepartId: 'sparepart-123',
          type: 'OUT',
          quantity: 10,
          createdAt: new Date(),
        },
      ];

      mockStockService.getStockHistory.mockResolvedValue(expectedTransactions);

      const result = await controller.getStockHistory();

      expect(result).toEqual(expectedTransactions);
      expect(result).toHaveLength(2);
      expect(mockStockService.getStockHistory).toHaveBeenCalledWith(
        undefined,
        undefined,
      );
    });

    it('should filter by warehouseId', async () => {
      const warehouseId = 'warehouse-123';
      mockStockService.getStockHistory.mockResolvedValue([]);

      await controller.getStockHistory(warehouseId);

      expect(mockStockService.getStockHistory).toHaveBeenCalledWith(
        warehouseId,
        undefined,
      );
    });

    it('should filter by sparepartId', async () => {
      const sparepartId = 'sparepart-123';
      mockStockService.getStockHistory.mockResolvedValue([]);

      await controller.getStockHistory(undefined, sparepartId);

      expect(mockStockService.getStockHistory).toHaveBeenCalledWith(
        undefined,
        sparepartId,
      );
    });
  });
});
