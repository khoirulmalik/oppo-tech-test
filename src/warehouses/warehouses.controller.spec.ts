import { Test, TestingModule } from '@nestjs/testing';
import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { WarehouseResponseDto } from './dto/warehouse-response.dto';

describe('WarehousesController', () => {
  let controller: WarehousesController;

  const mockWarehousesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WarehousesController],
      providers: [
        {
          provide: WarehousesService,
          useValue: mockWarehousesService,
        },
      ],
    }).compile();

    controller = module.get<WarehousesController>(WarehousesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a warehouse', async () => {
      const createWarehouseDto: CreateWarehouseDto = {
        name: 'Warehouse A',
        code: 'WH-A',
      };

      const expectedResponse: WarehouseResponseDto = {
        id: 'uuid-123',
        name: 'Warehouse A',
        code: 'WH-A',
        createdAt: new Date(),
      };

      mockWarehousesService.create.mockResolvedValue(expectedResponse);

      const result = await controller.create(createWarehouseDto);

      expect(result).toEqual(expectedResponse);
      expect(mockWarehousesService.create).toHaveBeenCalledWith(
        createWarehouseDto,
      );
      expect(mockWarehousesService.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return an array of warehouses', async () => {
      const expectedWarehouses: WarehouseResponseDto[] = [
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

      mockWarehousesService.findAll.mockResolvedValue(expectedWarehouses);

      const result = await controller.findAll();

      expect(result).toEqual(expectedWarehouses);
      expect(result).toHaveLength(2);
      expect(mockWarehousesService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no warehouses exist', async () => {
      mockWarehousesService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a warehouse by id', async () => {
      const warehouseId = 'uuid-123';
      const expectedWarehouse: WarehouseResponseDto = {
        id: warehouseId,
        name: 'Warehouse A',
        code: 'WH-A',
        createdAt: new Date(),
      };

      mockWarehousesService.findOne.mockResolvedValue(expectedWarehouse);

      const result = await controller.findOne(warehouseId);

      expect(result).toEqual(expectedWarehouse);
      expect(mockWarehousesService.findOne).toHaveBeenCalledWith(warehouseId);
      expect(mockWarehousesService.findOne).toHaveBeenCalledTimes(1);
    });
  });
});
