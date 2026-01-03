import { Test, TestingModule } from '@nestjs/testing';
import { StockRepository } from './stock.repository';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';

describe('StockRepository', () => {
  let repository: StockRepository;

  const mockPrismaService = {
    warehouseStock: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    stockTransaction: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<StockRepository>(StockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findStock', () => {
    it('should find stock by warehouse and sparepart', async () => {
      const warehouseId = 'warehouse-123';
      const sparepartId = 'sparepart-123';
      const expectedStock = {
        id: 'stock-123',
        warehouseId,
        sparepartId,
        currentStock: 100,
        updatedAt: new Date(),
      };

      mockPrismaService.warehouseStock.findUnique.mockResolvedValue(
        expectedStock,
      );

      const result = await repository.findStock(warehouseId, sparepartId);

      expect(result).toEqual(expectedStock);
      expect(mockPrismaService.warehouseStock.findUnique).toHaveBeenCalledWith({
        where: {
          warehouseId_sparepartId: {
            warehouseId,
            sparepartId,
          },
        },
      });
    });

    it('should return null if stock not found', async () => {
      mockPrismaService.warehouseStock.findUnique.mockResolvedValue(null);

      const result = await repository.findStock(
        'warehouse-123',
        'sparepart-123',
      );

      expect(result).toBeNull();
    });
  });

  describe('findStockWithLock', () => {
    it('should find stock with lock', async () => {
      const warehouseId = 'warehouse-123';
      const sparepartId = 'sparepart-123';
      const mockStock = [
        {
          id: 'stock-123',
          warehouse_id: warehouseId,
          sparepart_id: sparepartId,
          current_stock: 100,
          updated_at: new Date(),
        },
      ];

      // ✅ FIX: Gunakan $queryRawUnsafe, bukan $queryRaw
      mockPrismaService.$queryRawUnsafe.mockResolvedValue(mockStock);

      const result = await repository.findStockWithLock(
        warehouseId,
        sparepartId,
      );

      expect(result).toBeDefined();
      expect(result?.id).toBe('stock-123');
      expect(result?.currentStock).toBe(100);
      expect(mockPrismaService.$queryRawUnsafe).toHaveBeenCalled(); // ✅ Update assertion juga
    });

    it('should return null if no stock found with lock', async () => {
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([]);

      const result = await repository.findStockWithLock(
        'warehouse-123',
        'sparepart-123',
      );

      expect(result).toBeNull();
    });
  });

  describe('createStock', () => {
    it('should create new stock', async () => {
      const createData = {
        warehouseId: 'warehouse-123',
        sparepartId: 'sparepart-123',
        currentStock: 50,
      };

      const expectedStock = {
        id: 'stock-123',
        ...createData,
        updatedAt: new Date(),
      };

      mockPrismaService.warehouseStock.create.mockResolvedValue(expectedStock);

      const result = await repository.createStock(createData);

      expect(result).toEqual(expectedStock);
      expect(mockPrismaService.warehouseStock.create).toHaveBeenCalledWith({
        data: createData,
      });
    });
  });

  describe('updateStock', () => {
    it('should update stock', async () => {
      const stockId = 'stock-123';
      const newStock = 150;
      const expectedStock = {
        id: stockId,
        warehouseId: 'warehouse-123',
        sparepartId: 'sparepart-123',
        currentStock: newStock,
        updatedAt: new Date(),
      };

      mockPrismaService.warehouseStock.update.mockResolvedValue(expectedStock);

      const result = await repository.updateStock(stockId, newStock);

      expect(result).toEqual(expectedStock);
      expect(mockPrismaService.warehouseStock.update).toHaveBeenCalledWith({
        where: { id: stockId },
        data: { currentStock: newStock },
      });
    });
  });

  describe('createTransaction', () => {
    it('should create stock transaction', async () => {
      const transactionData = {
        warehouseId: 'warehouse-123',
        sparepartId: 'sparepart-123',
        type: TransactionType.IN,
        quantity: 50,
      };

      const expectedTransaction = {
        id: 'transaction-123',
        ...transactionData,
        createdAt: new Date(),
      };

      mockPrismaService.stockTransaction.create.mockResolvedValue(
        expectedTransaction,
      );

      const result = await repository.createTransaction(transactionData);

      expect(result).toEqual(expectedTransaction);
      expect(mockPrismaService.stockTransaction.create).toHaveBeenCalledWith({
        data: transactionData,
      });
    });
  });

  describe('getStockHistory', () => {
    it('should get all stock history', async () => {
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

      mockPrismaService.stockTransaction.findMany.mockResolvedValue(
        expectedTransactions,
      );

      const result = await repository.getStockHistory();

      expect(result).toEqual(expectedTransactions);
      expect(mockPrismaService.stockTransaction.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by warehouseId', async () => {
      const warehouseId = 'warehouse-123';
      mockPrismaService.stockTransaction.findMany.mockResolvedValue([]);

      await repository.getStockHistory(warehouseId);

      expect(mockPrismaService.stockTransaction.findMany).toHaveBeenCalledWith({
        where: { warehouseId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by sparepartId', async () => {
      const sparepartId = 'sparepart-123';
      mockPrismaService.stockTransaction.findMany.mockResolvedValue([]);

      await repository.getStockHistory(undefined, sparepartId);

      expect(mockPrismaService.stockTransaction.findMany).toHaveBeenCalledWith({
        where: { sparepartId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by both warehouseId and sparepartId', async () => {
      const warehouseId = 'warehouse-123';
      const sparepartId = 'sparepart-123';
      mockPrismaService.stockTransaction.findMany.mockResolvedValue([]);

      await repository.getStockHistory(warehouseId, sparepartId);

      expect(mockPrismaService.stockTransaction.findMany).toHaveBeenCalledWith({
        where: { warehouseId, sparepartId },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
