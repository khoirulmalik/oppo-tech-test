import { Test, TestingModule } from '@nestjs/testing';
import { SparepartsRepository } from './spareparts.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('SparepartsRepository', () => {
  let repository: SparepartsRepository;

  const mockPrismaService = {
    sparepart: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SparepartsRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<SparepartsRepository>(SparepartsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a sparepart', async () => {
      const createSparepartDto = {
        name: 'Engine Oil Filter',
        sku: 'ENG-OIL-001',
      };

      const expectedSparepart = {
        id: 'uuid-123',
        ...createSparepartDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.sparepart.create.mockResolvedValue(expectedSparepart);

      const result = await repository.create(createSparepartDto);

      expect(result).toEqual(expectedSparepart);
      expect(mockPrismaService.sparepart.create).toHaveBeenCalledWith({
        data: createSparepartDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of spareparts', async () => {
      const expectedSpareparts = [
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

      mockPrismaService.sparepart.findMany.mockResolvedValue(
        expectedSpareparts,
      );

      const result = await repository.findAll();

      expect(result).toEqual(expectedSpareparts);
      expect(mockPrismaService.sparepart.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findById', () => {
    it('should return a sparepart by id', async () => {
      const sparepartId = 'uuid-123';
      const expectedSparepart = {
        id: sparepartId,
        name: 'Engine Oil Filter',
        sku: 'ENG-OIL-001',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.sparepart.findUnique.mockResolvedValue(
        expectedSparepart,
      );

      const result = await repository.findById(sparepartId);

      expect(result).toEqual(expectedSparepart);
      expect(mockPrismaService.sparepart.findUnique).toHaveBeenCalledWith({
        where: { id: sparepartId },
      });
    });

    it('should return null if sparepart not found', async () => {
      mockPrismaService.sparepart.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findBySku', () => {
    it('should return a sparepart by SKU', async () => {
      const sparepartSku = 'ENG-OIL-001';
      const expectedSparepart = {
        id: 'uuid-123',
        name: 'Engine Oil Filter',
        sku: sparepartSku,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.sparepart.findUnique.mockResolvedValue(
        expectedSparepart,
      );

      const result = await repository.findBySku(sparepartSku);

      expect(result).toEqual(expectedSparepart);
      expect(mockPrismaService.sparepart.findUnique).toHaveBeenCalledWith({
        where: { sku: sparepartSku },
      });
    });

    it('should return null if sparepart not found', async () => {
      mockPrismaService.sparepart.findUnique.mockResolvedValue(null);

      const result = await repository.findBySku('NON-EXISTENT');

      expect(result).toBeNull();
    });
  });
});
