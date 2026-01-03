import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { StockModule } from '../src/stock/stock.module';
import { WarehousesModule } from '../src/warehouses/warehouses.module';
import { SparepartsModule } from '../src/spareparts/spareparts.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import request from 'supertest';

describe('Stock Concurrency Tests (Critical)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let warehouseId1: string;
  let warehouseId2: string;
  let sparepartId1: string;
  let sparepartId2: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, WarehousesModule, SparepartsModule, StockModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await prisma.stockTransaction.deleteMany();
    await prisma.warehouseStock.deleteMany();
    await prisma.sparepart.deleteMany();
    await prisma.warehouse.deleteMany();

    const warehouse1 = await prisma.warehouse.create({
      data: { name: 'Warehouse Jakarta', code: 'WH-JKT-TEST' },
    });
    warehouseId1 = warehouse1.id;

    const warehouse2 = await prisma.warehouse.create({
      data: { name: 'Warehouse Bandung', code: 'WH-BDG-TEST' },
    });
    warehouseId2 = warehouse2.id;

    const sparepart1 = await prisma.sparepart.create({
      data: { name: 'Engine Filter', sku: 'SP-ENG-001' },
    });
    sparepartId1 = sparepart1.id;

    const sparepart2 = await prisma.sparepart.create({
      data: { name: 'Brake Pad', sku: 'SP-BRK-001' },
    });
    sparepartId2 = sparepart2.id;
  });

  afterEach(async () => {
    await prisma.stockTransaction.deleteMany();
    await prisma.warehouseStock.deleteMany();
  });

  afterAll(async () => {
    await prisma.stockTransaction.deleteMany();
    await prisma.warehouseStock.deleteMany();
    await prisma.sparepart.deleteMany();
    await prisma.warehouse.deleteMany();
    await app.close();
  });

  describe('Test 1: 2 Stock Out Bersamaan di Warehouse yang Sama', () => {
    it('should handle concurrent stock out without race condition', async () => {
      await request(app.getHttpServer())
        .post('/stock/in')
        .send({
          warehouseId: warehouseId1,
          sparepartId: sparepartId1,
          quantity: 100,
        })
        .expect(201);

      const promises = [
        request(app.getHttpServer()).post('/stock/out').send({
          warehouseId: warehouseId1,
          sparepartId: sparepartId1,
          quantity: 30,
        }),
        request(app.getHttpServer()).post('/stock/out').send({
          warehouseId: warehouseId1,
          sparepartId: sparepartId1,
          quantity: 40,
        }),
      ];

      const results = await Promise.all(promises);

      expect(results[0].status).toBe(201);
      expect(results[1].status).toBe(201);

      const finalStock = await prisma.warehouseStock.findUnique({
        where: {
          warehouseId_sparepartId: {
            warehouseId: warehouseId1,
            sparepartId: sparepartId1,
          },
        },
      });

      expect(finalStock?.currentStock).toBe(30);

      const transactions = await prisma.stockTransaction.findMany({
        where: {
          warehouseId: warehouseId1,
          sparepartId: sparepartId1,
          type: 'OUT',
        },
      });

      expect(transactions.length).toBe(2);
      expect(transactions[0].quantity + transactions[1].quantity).toBe(70);
    });

    it('should prevent negative stock from concurrent requests', async () => {
      await prisma.warehouseStock.create({
        data: {
          warehouseId: warehouseId1,
          sparepartId: sparepartId1,
          currentStock: 50,
        },
      });

      const promises = [
        request(app.getHttpServer()).post('/stock/out').send({
          warehouseId: warehouseId1,
          sparepartId: sparepartId1,
          quantity: 30,
        }),
        request(app.getHttpServer()).post('/stock/out').send({
          warehouseId: warehouseId1,
          sparepartId: sparepartId1,
          quantity: 30,
        }),
        request(app.getHttpServer()).post('/stock/out').send({
          warehouseId: warehouseId1,
          sparepartId: sparepartId1,
          quantity: 30,
        }),
      ];

      const results = await Promise.allSettled(promises);

      const successCount = results.filter(
        (r) => r.status === 'fulfilled' && r.value.status === 201,
      ).length;

      const failedCount = results.filter(
        (r) =>
          r.status === 'fulfilled' &&
          (r.value.status === 400 || r.value.status === 404),
      ).length;

      expect(successCount).toBeLessThanOrEqual(1);
      expect(failedCount).toBeGreaterThanOrEqual(2);

      const finalStock = await prisma.warehouseStock.findUnique({
        where: {
          warehouseId_sparepartId: {
            warehouseId: warehouseId1,
            sparepartId: sparepartId1,
          },
        },
      });

      expect(finalStock?.currentStock).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Test 2: Stock In dan Stock Out Paralel', () => {
    it('should handle concurrent stock in and stock out correctly', async () => {
      await prisma.warehouseStock.create({
        data: {
          warehouseId: warehouseId1,
          sparepartId: sparepartId2,
          currentStock: 100,
        },
      });

      const promises = [
        request(app.getHttpServer()).post('/stock/in').send({
          warehouseId: warehouseId1,
          sparepartId: sparepartId2,
          quantity: 50,
        }),
        request(app.getHttpServer()).post('/stock/out').send({
          warehouseId: warehouseId1,
          sparepartId: sparepartId2,
          quantity: 30,
        }),
        request(app.getHttpServer()).post('/stock/in').send({
          warehouseId: warehouseId1,
          sparepartId: sparepartId2,
          quantity: 20,
        }),
        request(app.getHttpServer()).post('/stock/out').send({
          warehouseId: warehouseId1,
          sparepartId: sparepartId2,
          quantity: 40,
        }),
      ];

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.status).toBe(201);
      });

      const finalStock = await prisma.warehouseStock.findUnique({
        where: {
          warehouseId_sparepartId: {
            warehouseId: warehouseId1,
            sparepartId: sparepartId2,
          },
        },
      });

      expect(finalStock?.currentStock).toBe(100);

      const transactions = await prisma.stockTransaction.findMany({
        where: {
          warehouseId: warehouseId1,
          sparepartId: sparepartId2,
        },
      });

      const totalIn = transactions
        .filter((t) => t.type === 'IN')
        .reduce((sum, t) => sum + t.quantity, 0);

      const totalOut = transactions
        .filter((t) => t.type === 'OUT')
        .reduce((sum, t) => sum + t.quantity, 0);

      expect(totalIn).toBe(70);
      expect(totalOut).toBe(70);
    });
  });

  describe('Test 3: Transaksi di Warehouse Berbeda Tidak Saling Mempengaruhi', () => {
    it('should isolate transactions between different warehouses', async () => {
      await prisma.warehouseStock.createMany({
        data: [
          {
            warehouseId: warehouseId1,
            sparepartId: sparepartId1,
            currentStock: 100,
          },
          {
            warehouseId: warehouseId2,
            sparepartId: sparepartId1,
            currentStock: 100,
          },
        ],
      });

      const promises = [
        request(app.getHttpServer()).post('/stock/out').send({
          warehouseId: warehouseId1,
          sparepartId: sparepartId1,
          quantity: 50,
        }),
        request(app.getHttpServer()).post('/stock/out').send({
          warehouseId: warehouseId2,
          sparepartId: sparepartId1,
          quantity: 30,
        }),
        request(app.getHttpServer()).post('/stock/in').send({
          warehouseId: warehouseId1,
          sparepartId: sparepartId1,
          quantity: 20,
        }),
        request(app.getHttpServer()).post('/stock/in').send({
          warehouseId: warehouseId2,
          sparepartId: sparepartId1,
          quantity: 40,
        }),
      ];

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.status).toBe(201);
      });

      const stock1 = await prisma.warehouseStock.findUnique({
        where: {
          warehouseId_sparepartId: {
            warehouseId: warehouseId1,
            sparepartId: sparepartId1,
          },
        },
      });

      const stock2 = await prisma.warehouseStock.findUnique({
        where: {
          warehouseId_sparepartId: {
            warehouseId: warehouseId2,
            sparepartId: sparepartId1,
          },
        },
      });

      expect(stock1?.currentStock).toBe(70);
      expect(stock2?.currentStock).toBe(110);
      expect(stock1?.currentStock).not.toBe(stock2?.currentStock);
    });
  });

  describe('Test 4: Multiple Request Paralel Tidak Menyebabkan Stok Minus', () => {
    it('should prevent negative stock with high concurrent load (10 requests)', async () => {
      await prisma.warehouseStock.create({
        data: {
          warehouseId: warehouseId2,
          sparepartId: sparepartId2,
          currentStock: 100,
        },
      });

      const promises = Array.from({ length: 10 }, () =>
        request(app.getHttpServer()).post('/stock/out').send({
          warehouseId: warehouseId2,
          sparepartId: sparepartId2,
          quantity: 15,
        }),
      );

      const results = await Promise.allSettled(promises);

      const successResults = results.filter(
        (r) => r.status === 'fulfilled' && r.value.status === 201,
      );

      const failedResults = results.filter(
        (r) =>
          r.status === 'fulfilled' &&
          (r.value.status === 400 || r.value.status === 404),
      ).length;

      expect(successResults.length).toBeLessThanOrEqual(6);
      expect(failedResults).toBeGreaterThanOrEqual(4);

      const finalStock = await prisma.warehouseStock.findUnique({
        where: {
          warehouseId_sparepartId: {
            warehouseId: warehouseId2,
            sparepartId: sparepartId2,
          },
        },
      });

      expect(finalStock?.currentStock).toBeGreaterThanOrEqual(0);

      const totalTaken = successResults.length * 15;
      expect(finalStock?.currentStock).toBe(100 - totalTaken);
    });

    it('should handle extreme concurrent load (50 requests)', async () => {
      await prisma.warehouseStock.create({
        data: {
          warehouseId: warehouseId1,
          sparepartId: sparepartId1,
          currentStock: 500,
        },
      });

      const promises = [
        ...Array.from({ length: 30 }, () =>
          request(app.getHttpServer()).post('/stock/out').send({
            warehouseId: warehouseId1,
            sparepartId: sparepartId1,
            quantity: 10,
          }),
        ),
        ...Array.from({ length: 20 }, () =>
          request(app.getHttpServer()).post('/stock/in').send({
            warehouseId: warehouseId1,
            sparepartId: sparepartId1,
            quantity: 5,
          }),
        ),
      ];

      const results = await Promise.allSettled(promises);

      const successCount = results.filter(
        (r) => r.status === 'fulfilled' && r.value.status === 201,
      ).length;

      expect(successCount).toBeGreaterThan(30);

      const finalStock = await prisma.warehouseStock.findUnique({
        where: {
          warehouseId_sparepartId: {
            warehouseId: warehouseId1,
            sparepartId: sparepartId1,
          },
        },
      });

      expect(finalStock?.currentStock).toBeGreaterThanOrEqual(0);

      const transactions = await prisma.stockTransaction.findMany({
        where: {
          warehouseId: warehouseId1,
          sparepartId: sparepartId1,
        },
      });

      const totalIn = transactions
        .filter((t) => t.type === 'IN')
        .reduce((sum, t) => sum + t.quantity, 0);

      const totalOut = transactions
        .filter((t) => t.type === 'OUT')
        .reduce((sum, t) => sum + t.quantity, 0);

      expect(finalStock?.currentStock).toBe(500 + totalIn - totalOut);
    });
  });
});
