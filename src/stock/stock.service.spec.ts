import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockRepository } from './stock.repository';
import { PrismaService } from '../prisma/prisma.service';
import { WarehousesRepository } from '../warehouses/warehouses.repository';
import { SparepartsRepository } from '../spareparts/spareparts.repository';
import { STOCK_ERROR_MESSAGES } from './constants';
import { TransactionType } from '@prisma/client';

describe('StockService', () => {
  let service: StockService;

  const mockPrismaService = {
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(), // ADD THIS LINE
  };

  const mockStockRepository = {
    findStock: jest.fn(),
    findStockWithLock: jest.fn(),
    createStock: jest.fn(),
    updateStock: jest.fn(),
    createTransaction: jest.fn(),
    getStockHistory: jest.fn(),
  };

  const mockWarehouseRepository = {
    findById: jest.fn(),
  };

  const mockSparepartRepository = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: StockRepository,
          useValue: mockStockRepository,
        },
        {
          provide: WarehousesRepository,
          useValue: mockWarehouseRepository,
        },
        {
          provide: SparepartsRepository,
          useValue: mockSparepartRepository,
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('stockIn', () => {
    it('should successfully add stock', async () => {
      const stockInDto = {
        warehouseId: 'warehouse-123',
        sparepartId: 'sparepart-123',
        quantity: 50,
      };

      const warehouse = {
        id: 'warehouse-123',
        name: 'Warehouse A',
        code: 'WH-A',
        createdAt: new Date(),
      };

      const sparepart = {
        id: 'sparepart-123',
        name: 'Engine Oil',
        sku: 'ENG-001',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedTransaction = {
        id: 'transaction-123',
        warehouseId: stockInDto.warehouseId,
        sparepartId: stockInDto.sparepartId,
        type: TransactionType.IN,
        quantity: stockInDto.quantity,
        createdAt: new Date(),
      };

      mockWarehouseRepository.findById.mockResolvedValue(warehouse);
      mockSparepartRepository.findById.mockResolvedValue(sparepart);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          $queryRawUnsafe: jest.fn().mockResolvedValue([]),
          warehouseStock: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: 'stock-123',
              warehouseId: stockInDto.warehouseId,
              sparepartId: stockInDto.sparepartId,
              currentStock: stockInDto.quantity,
              updatedAt: new Date(),
            }),
          },
          stockTransaction: {
            create: jest.fn().mockResolvedValue(expectedTransaction),
          },
        });
      });

      const result = await service.stockIn(stockInDto);

      expect(result.id).toBe(expectedTransaction.id);
      expect(result.quantity).toBe(stockInDto.quantity);
      expect(mockWarehouseRepository.findById).toHaveBeenCalledWith(
        stockInDto.warehouseId,
      );
      expect(mockSparepartRepository.findById).toHaveBeenCalledWith(
        stockInDto.sparepartId,
      );
    });

    it('should throw NotFoundException if warehouse not found', async () => {
      const stockInDto = {
        warehouseId: 'non-existent',
        sparepartId: 'sparepart-123',
        quantity: 50,
      };

      mockWarehouseRepository.findById.mockResolvedValue(null);

      await expect(service.stockIn(stockInDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.stockIn(stockInDto)).rejects.toThrow(
        STOCK_ERROR_MESSAGES.WAREHOUSE_NOT_FOUND(stockInDto.warehouseId),
      );
    });

    it('should throw NotFoundException if sparepart not found', async () => {
      const stockInDto = {
        warehouseId: 'warehouse-123',
        sparepartId: 'non-existent',
        quantity: 50,
      };

      const warehouse = {
        id: 'warehouse-123',
        name: 'Warehouse A',
        code: 'WH-A',
        createdAt: new Date(),
      };

      mockWarehouseRepository.findById.mockResolvedValue(warehouse);
      mockSparepartRepository.findById.mockResolvedValue(null);

      await expect(service.stockIn(stockInDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.stockIn(stockInDto)).rejects.toThrow(
        STOCK_ERROR_MESSAGES.SPAREPART_NOT_FOUND(stockInDto.sparepartId),
      );
    });

    it('should throw BadRequestException if quantity is invalid', async () => {
      const stockInDto = {
        warehouseId: 'warehouse-123',
        sparepartId: 'sparepart-123',
        quantity: 0,
      };

      const warehouse = {
        id: 'warehouse-123',
        name: 'Warehouse A',
        code: 'WH-A',
        createdAt: new Date(),
      };

      const sparepart = {
        id: 'sparepart-123',
        name: 'Engine Oil',
        sku: 'ENG-001',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWarehouseRepository.findById.mockResolvedValue(warehouse);
      mockSparepartRepository.findById.mockResolvedValue(sparepart);

      await expect(service.stockIn(stockInDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.stockIn(stockInDto)).rejects.toThrow(
        STOCK_ERROR_MESSAGES.INVALID_QUANTITY,
      );
    });
  });

  describe('stockOut', () => {
    it('should successfully remove stock', async () => {
      const stockOutDto = {
        warehouseId: 'warehouse-123',
        sparepartId: 'sparepart-123',
        quantity: 10,
      };

      const warehouse = {
        id: 'warehouse-123',
        name: 'Warehouse A',
        code: 'WH-A',
        createdAt: new Date(),
      };

      const sparepart = {
        id: 'sparepart-123',
        name: 'Engine Oil',
        sku: 'ENG-001',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedTransaction = {
        id: 'transaction-123',
        warehouseId: stockOutDto.warehouseId,
        sparepartId: stockOutDto.sparepartId,
        type: TransactionType.OUT,
        quantity: stockOutDto.quantity,
        createdAt: new Date(),
      };

      mockWarehouseRepository.findById.mockResolvedValue(warehouse);
      mockSparepartRepository.findById.mockResolvedValue(sparepart);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          $queryRawUnsafe: jest.fn().mockResolvedValue([
            {
              id: 'stock-123',
              warehouse_id: stockOutDto.warehouseId,
              sparepart_id: stockOutDto.sparepartId,
              current_stock: 100,
              updated_at: new Date(),
            },
          ]),
          warehouseStock: {
            update: jest.fn().mockResolvedValue({
              id: 'stock-123',
              warehouseId: stockOutDto.warehouseId,
              sparepartId: stockOutDto.sparepartId,
              currentStock: 90,
              updatedAt: new Date(),
            }),
          },
          stockTransaction: {
            create: jest.fn().mockResolvedValue(expectedTransaction),
          },
        });
      });

      const result = await service.stockOut(stockOutDto);

      expect(result.id).toBe(expectedTransaction.id);
      expect(result.quantity).toBe(stockOutDto.quantity);
    });

    it('should throw NotFoundException if stock not found', async () => {
      const stockOutDto = {
        warehouseId: 'warehouse-123',
        sparepartId: 'sparepart-123',
        quantity: 10,
      };

      const warehouse = {
        id: 'warehouse-123',
        name: 'Warehouse A',
        code: 'WH-A',
        createdAt: new Date(),
      };

      const sparepart = {
        id: 'sparepart-123',
        name: 'Engine Oil',
        sku: 'ENG-001',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWarehouseRepository.findById.mockResolvedValue(warehouse);
      mockSparepartRepository.findById.mockResolvedValue(sparepart);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          $queryRawUnsafe: jest.fn().mockResolvedValue([]),
        });
      });

      await expect(service.stockOut(stockOutDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if insufficient stock', async () => {
      const stockOutDto = {
        warehouseId: 'warehouse-123',
        sparepartId: 'sparepart-123',
        quantity: 200,
      };

      const warehouse = {
        id: 'warehouse-123',
        name: 'Warehouse A',
        code: 'WH-A',
        createdAt: new Date(),
      };

      const sparepart = {
        id: 'sparepart-123',
        name: 'Engine Oil',
        sku: 'ENG-001',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWarehouseRepository.findById.mockResolvedValue(warehouse);
      mockSparepartRepository.findById.mockResolvedValue(sparepart);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          $queryRawUnsafe: jest.fn().mockResolvedValue([
            {
              id: 'stock-123',
              warehouse_id: stockOutDto.warehouseId,
              sparepart_id: stockOutDto.sparepartId,
              current_stock: 100,
              updated_at: new Date(),
            },
          ]),
        });
      });

      await expect(service.stockOut(stockOutDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getStock', () => {
    it('should return stock information', async () => {
      const warehouseId = 'warehouse-123';
      const sparepartId = 'sparepart-123';
      const expectedStock = {
        id: 'stock-123',
        warehouseId,
        sparepartId,
        currentStock: 100,
        updatedAt: new Date(),
      };

      mockStockRepository.findStock.mockResolvedValue(expectedStock);

      const result = await service.getStock(warehouseId, sparepartId);

      expect(result.id).toBe(expectedStock.id);
      expect(result.currentStock).toBe(expectedStock.currentStock);
      expect(mockStockRepository.findStock).toHaveBeenCalledWith(
        warehouseId,
        sparepartId,
      );
    });

    it('should throw NotFoundException if stock not found', async () => {
      const warehouseId = 'warehouse-123';
      const sparepartId = 'sparepart-123';

      mockStockRepository.findStock.mockResolvedValue(null);

      await expect(service.getStock(warehouseId, sparepartId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getStock(warehouseId, sparepartId)).rejects.toThrow(
        STOCK_ERROR_MESSAGES.STOCK_NOT_FOUND(warehouseId, sparepartId),
      );
    });
  });

  describe('getStockHistory', () => {
    it('should return all stock history', async () => {
      const expectedTransactions = [
        {
          id: 'transaction-1',
          warehouseId: 'warehouse-123',
          sparepartId: 'sparepart-123',
          type: TransactionType.IN,
          quantity: 50,
          createdAt: new Date(),
        },
        {
          id: 'transaction-2',
          warehouseId: 'warehouse-123',
          sparepartId: 'sparepart-123',
          type: TransactionType.OUT,
          quantity: 10,
          createdAt: new Date(),
        },
      ];

      mockStockRepository.getStockHistory.mockResolvedValue(
        expectedTransactions,
      );

      const result = await service.getStockHistory();

      expect(result).toHaveLength(2);
      expect(mockStockRepository.getStockHistory).toHaveBeenCalledWith(
        undefined,
        undefined,
      );
    });
  });
});
