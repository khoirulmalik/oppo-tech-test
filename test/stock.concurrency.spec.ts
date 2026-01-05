import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { StockModule } from '../src/stock/stock.module';
import { WarehousesModule } from '../src/warehouses/warehouses.module';
import { SparepartsModule } from '../src/spareparts/spareparts.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import request from 'supertest';
import { reporter } from './helpers/concurrency-reporter';

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

    reporter.clear();
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

    // Print summary report
    reporter.printSummary();

    // Export to JSON (optional)
    // reporter.exportToJson('test-results/concurrency-report.json');

    await app.close();
  });

  describe('Test 1: 2 Stock Out Bersamaan di Warehouse yang Sama', () => {
    it('should handle concurrent stock out without race condition', async () => {
      reporter.startTest();

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
      const duration = reporter.endTest();

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

      const expectedStock = 30;
      expect(finalStock?.currentStock).toBe(expectedStock);

      const transactions = await prisma.stockTransaction.findMany({
        where: {
          warehouseId: warehouseId1,
          sparepartId: sparepartId1,
          type: 'OUT',
        },
      });

      expect(transactions.length).toBe(2);

      reporter.addResult({
        testName: 'Concurrent Stock Out (2 requests)',
        duration,
        totalRequests: 2,
        successCount: 2,
        failedCount: 0,
        finalStock: finalStock?.currentStock || 0,
        expectedStock,
        stockConsistent: finalStock?.currentStock === expectedStock,
        additionalInfo: {
          'Initial Stock': 100,
          'Request 1': '30 OUT',
          'Request 2': '40 OUT',
        },
      });
    });

    it('should prevent negative stock from concurrent requests', async () => {
      reporter.startTest();

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
      const duration = reporter.endTest();

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

      reporter.addResult({
        testName: 'Prevent Negative Stock (3 competing requests)',
        duration,
        totalRequests: 3,
        successCount,
        failedCount,
        finalStock: finalStock?.currentStock || 0,
        expectedStock: 20, // 50 - 30 = 20
        stockConsistent: (finalStock?.currentStock || 0) >= 0,
        additionalInfo: {
          'Initial Stock': 50,
          'Each Request': '30 OUT',
          'Max Possible Success': 1,
        },
      });
    });
  });

  describe('Test 2: Stock In dan Stock Out Paralel', () => {
    it('should handle concurrent stock in and stock out correctly', async () => {
      reporter.startTest();

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
      const duration = reporter.endTest();

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

      const expectedStock = 100;
      expect(finalStock?.currentStock).toBe(expectedStock);

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

      reporter.addResult({
        testName: 'Mixed Stock In/Out Operations',
        duration,
        totalRequests: 4,
        successCount: 4,
        failedCount: 0,
        finalStock: finalStock?.currentStock || 0,
        expectedStock,
        stockConsistent: finalStock?.currentStock === expectedStock,
        additionalInfo: {
          'Initial Stock': 100,
          'Total IN': totalIn,
          'Total OUT': totalOut,
          'Net Change': totalIn - totalOut,
        },
      });
    });
  });

  describe('Test 3: Transaksi di Warehouse Berbeda Tidak Saling Mempengaruhi', () => {
    it('should isolate transactions between different warehouses', async () => {
      reporter.startTest();

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
      const duration = reporter.endTest();

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

      reporter.addResult({
        testName: 'Warehouse Isolation Test',
        duration,
        totalRequests: 4,
        successCount: 4,
        failedCount: 0,
        stockConsistent:
          stock1?.currentStock === 70 && stock2?.currentStock === 110,
        additionalInfo: {
          'Warehouse 1 Initial': 100,
          'Warehouse 1 Final': stock1?.currentStock || 0,
          'Warehouse 2 Initial': 100,
          'Warehouse 2 Final': stock2?.currentStock || 0,
          'Isolated Correctly': stock1?.currentStock !== stock2?.currentStock,
        },
      });
    });
  });

  describe('Test 4: Multiple Request Paralel Tidak Menyebabkan Stok Minus', () => {
    it('should prevent negative stock with high concurrent load (10 requests)', async () => {
      reporter.startTest();

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
      const duration = reporter.endTest();

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

      reporter.addResult({
        testName: 'High Concurrency Load (10 requests)',
        duration,
        totalRequests: 10,
        successCount: successResults.length,
        failedCount: failedResults,
        finalStock: finalStock?.currentStock || 0,
        expectedStock: 100 - totalTaken,
        stockConsistent: (finalStock?.currentStock || 0) >= 0,
        additionalInfo: {
          'Initial Stock': 100,
          'Each Request': '15 OUT',
          'Max Possible Success': 6,
          'Stock Never Negative': true,
        },
      });
    });

    it('should handle extreme concurrent load (50 requests)', async () => {
      reporter.startTest();

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
      const duration = reporter.endTest();

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

      const expectedStock = 500 + totalIn - totalOut;
      expect(finalStock?.currentStock).toBe(expectedStock);

      reporter.addResult({
        testName: 'Extreme Load Test (50 requests)',
        duration,
        totalRequests: 50,
        successCount,
        failedCount: 50 - successCount,
        finalStock: finalStock?.currentStock || 0,
        expectedStock,
        stockConsistent: finalStock?.currentStock === expectedStock,
        additionalInfo: {
          'Initial Stock': 500,
          'OUT Requests': 30,
          'IN Requests': 20,
          'Total IN': totalIn,
          'Total OUT': totalOut,
          'Formula Check': `500 + ${totalIn} - ${totalOut} = ${expectedStock}`,
        },
      });
    });
  });
});
