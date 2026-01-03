import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SparepartsService } from './spareparts.service';
import { SparepartsRepository } from './spareparts.repository';
import { SPAREPART_ERROR_MESSAGES } from './constants';

describe('SparepartsService', () => {
  let service: SparepartsService;

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findBySku: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SparepartsService,
        {
          provide: SparepartsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SparepartsService>(SparepartsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a sparepart successfully', async () => {
      const createSparepartDto = {
        name: 'Engine Oil Filter',
        sku: 'ENG-OIL-001',
      };

      const createdSparepart = {
        id: 'uuid-123',
        ...createSparepartDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findBySku.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(createdSparepart);

      const result = await service.create(createSparepartDto);

      expect(result).toEqual({
        id: createdSparepart.id,
        name: createdSparepart.name,
        sku: createdSparepart.sku,
        createdAt: createdSparepart.createdAt,
        updatedAt: createdSparepart.updatedAt,
      });
      expect(mockRepository.findBySku).toHaveBeenCalledWith('ENG-OIL-001');
      expect(mockRepository.create).toHaveBeenCalledWith(createSparepartDto);
    });

    it('should throw ConflictException if sparepart SKU already exists', async () => {
      const createSparepartDto = {
        name: 'Engine Oil Filter',
        sku: 'ENG-OIL-001',
      };

      const existingSparepart = {
        id: 'uuid-123',
        ...createSparepartDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findBySku.mockResolvedValue(existingSparepart);

      await expect(service.create(createSparepartDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createSparepartDto)).rejects.toThrow(
        SPAREPART_ERROR_MESSAGES.ALREADY_EXISTS('ENG-OIL-001'),
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of spareparts', async () => {
      const spareparts = [
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

      mockRepository.findAll.mockResolvedValue(spareparts);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(spareparts[0]);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a sparepart by id', async () => {
      const sparepart = {
        id: 'uuid-123',
        name: 'Engine Oil Filter',
        sku: 'ENG-OIL-001',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(sparepart);

      const result = await service.findOne('uuid-123');

      expect(result).toEqual(sparepart);
      expect(mockRepository.findById).toHaveBeenCalledWith('uuid-123');
    });

    it('should throw NotFoundException if sparepart not found', async () => {
      const nonExistentId = 'non-existent-id';
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(nonExistentId)).rejects.toThrow(
        SPAREPART_ERROR_MESSAGES.NOT_FOUND(nonExistentId),
      );
    });
  });
});
