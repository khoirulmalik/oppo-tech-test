import { Test, TestingModule } from '@nestjs/testing';
import { WarehousesRepository } from './warehouses.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('WarehousesRepository', () => {
  let repository: WarehousesRepository;

  const mockPrismaService = {
    warehouse: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarehousesRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<WarehousesRepository>(WarehousesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a warehouse', async () => {
      const createWarehouseDto = {
        name: 'Warehouse A',
        code: 'WH-A',
      };

      const expectedWarehouse = {
        id: 'uuid-123',
        ...createWarehouseDto,
        createdAt: new Date(),
      };

      mockPrismaService.warehouse.create.mockResolvedValue(expectedWarehouse);

      const result = await repository.create(createWarehouseDto);

      expect(result).toEqual(expectedWarehouse);
      expect(mockPrismaService.warehouse.create).toHaveBeenCalledWith({
        data: createWarehouseDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of warehouses', async () => {
      const expectedWarehouses = [
        {
          id: 'uuid-1',
          name: 'Warehouse A',
          code: 'WH-A',
          createdAt: new Date(),
        },
        {
          id: 'uuid-2',
          name: 'Warehouse B',
          code: 'WH-B',
          createdAt: new Date(),
        },
      ];

      mockPrismaService.warehouse.findMany.mockResolvedValue(
        expectedWarehouses,
      );

      const result = await repository.findAll();

      expect(result).toEqual(expectedWarehouses);
      expect(mockPrismaService.warehouse.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findById', () => {
    it('should return a warehouse by id', async () => {
      const warehouseId = 'uuid-123';
      const expectedWarehouse = {
        id: warehouseId,
        name: 'Warehouse A',
        code: 'WH-A',
        createdAt: new Date(),
      };

      mockPrismaService.warehouse.findUnique.mockResolvedValue(
        expectedWarehouse,
      );

      const result = await repository.findById(warehouseId);

      expect(result).toEqual(expectedWarehouse);
      expect(mockPrismaService.warehouse.findUnique).toHaveBeenCalledWith({
        where: { id: warehouseId },
      });
    });

    it('should return null if warehouse not found', async () => {
      mockPrismaService.warehouse.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByCode', () => {
    it('should return a warehouse by code', async () => {
      const warehouseCode = 'WH-A';
      const expectedWarehouse = {
        id: 'uuid-123',
        name: 'Warehouse A',
        code: warehouseCode,
        createdAt: new Date(),
      };

      mockPrismaService.warehouse.findUnique.mockResolvedValue(
        expectedWarehouse,
      );

      const result = await repository.findByCode(warehouseCode);

      expect(result).toEqual(expectedWarehouse);
      expect(mockPrismaService.warehouse.findUnique).toHaveBeenCalledWith({
        where: { code: warehouseCode },
      });
    });

    it('should return null if warehouse not found', async () => {
      mockPrismaService.warehouse.findUnique.mockResolvedValue(null);

      const result = await repository.findByCode('NON-EXISTENT');

      expect(result).toBeNull();
    });
  });
});
