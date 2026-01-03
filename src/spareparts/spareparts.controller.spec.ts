import { Test, TestingModule } from '@nestjs/testing';
import { SparepartsController } from './spareparts.controller';
import { SparepartsService } from './spareparts.service';
import { CreateSparepartDto } from './dto/create-sparepart.dto';
import { SparepartResponseDto } from './dto/sparepart-response.dto';

describe('SparepartsController', () => {
  let controller: SparepartsController;

  const mockSparepartsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SparepartsController],
      providers: [
        {
          provide: SparepartsService,
          useValue: mockSparepartsService,
        },
      ],
    }).compile();

    controller = module.get<SparepartsController>(SparepartsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a sparepart', async () => {
      const createSparepartDto: CreateSparepartDto = {
        name: 'Engine Oil Filter',
        sku: 'ENG-OIL-001',
      };

      const expectedResponse: SparepartResponseDto = {
        id: 'uuid-123',
        name: 'Engine Oil Filter',
        sku: 'ENG-OIL-001',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSparepartsService.create.mockResolvedValue(expectedResponse);

      const result = await controller.create(createSparepartDto);

      expect(result).toEqual(expectedResponse);
      expect(mockSparepartsService.create).toHaveBeenCalledWith(
        createSparepartDto,
      );
      expect(mockSparepartsService.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return an array of spareparts', async () => {
      const expectedSpareparts: SparepartResponseDto[] = [
        {
          id: 'uuid-1',
          name: 'Engine Oil Filter',
          sku: 'ENG-OIL-001',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'uuid-2',
          name: 'Brake Pad',
          sku: 'BRK-PAD-001',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockSparepartsService.findAll.mockResolvedValue(expectedSpareparts);

      const result = await controller.findAll();

      expect(result).toEqual(expectedSpareparts);
      expect(result).toHaveLength(2);
      expect(mockSparepartsService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no spareparts exist', async () => {
      mockSparepartsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a sparepart by id', async () => {
      const sparepartId = 'uuid-123';
      const expectedSparepart: SparepartResponseDto = {
        id: sparepartId,
        name: 'Engine Oil Filter',
        sku: 'ENG-OIL-001',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSparepartsService.findOne.mockResolvedValue(expectedSparepart);

      const result = await controller.findOne(sparepartId);

      expect(result).toEqual(expectedSparepart);
      expect(mockSparepartsService.findOne).toHaveBeenCalledWith(sparepartId);
      expect(mockSparepartsService.findOne).toHaveBeenCalledTimes(1);
    });
  });
});
