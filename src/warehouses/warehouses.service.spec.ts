import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { WarehousesRepository } from './warehouses.repository';
import { WAREHOUSE_ERROR_MESSAGES } from './constants/warehouse.constants';

describe('WarehousesService', () => {
  let service: WarehousesService;

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarehousesService,
        {
          provide: WarehousesRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<WarehousesService>(WarehousesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a warehouse successfully', async () => {
      const createWarehouseDto = {
        name: 'Warehouse A',
        code: 'WH-A',
      };

      const createdWarehouse = {
        id: 'uuid-123',
        ...createWarehouseDto,
        createdAt: new Date(),
      };

      mockRepository.findByCode.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(createdWarehouse);

      const result = await service.create(createWarehouseDto);

      expect(result).toEqual({
        id: createdWarehouse.id,
        name: createdWarehouse.name,
        code: createdWarehouse.code,
        createdAt: createdWarehouse.createdAt,
      });
      expect(mockRepository.findByCode).toHaveBeenCalledWith('WH-A');
      expect(mockRepository.create).toHaveBeenCalledWith(createWarehouseDto);
    });

    it('should throw ConflictException if warehouse code already exists', async () => {
      const createWarehouseDto = {
        name: 'Warehouse A',
        code: 'WH-A',
      };

      const existingWarehouse = {
        id: 'uuid-123',
        ...createWarehouseDto,
        createdAt: new Date(),
      };

      mockRepository.findByCode.mockResolvedValue(existingWarehouse);

      await expect(service.create(createWarehouseDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createWarehouseDto)).rejects.toThrow(
        WAREHOUSE_ERROR_MESSAGES.ALREADY_EXISTS('WH-A'),
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of warehouses', async () => {
      const warehouses = [
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

      mockRepository.findAll.mockResolvedValue(warehouses);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(warehouses[0]);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a warehouse by id', async () => {
      const warehouse = {
        id: 'uuid-123',
        name: 'Warehouse A',
        code: 'WH-A',
        createdAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(warehouse);

      const result = await service.findOne('uuid-123');

      expect(result).toEqual(warehouse);
      expect(mockRepository.findById).toHaveBeenCalledWith('uuid-123');
    });

    it('should throw NotFoundException if warehouse not found', async () => {
      const nonExistentId = 'non-existent-id';
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(nonExistentId)).rejects.toThrow(
        WAREHOUSE_ERROR_MESSAGES.NOT_FOUND(nonExistentId),
      );
    });
  });
});
