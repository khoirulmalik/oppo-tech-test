import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ICreateSparepart,
  ISparepart,
  ISparepartRepository,
} from './interfaces/sparepart.interface';

@Injectable()
export class SparepartsRepository implements ISparepartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: ICreateSparepart): Promise<ISparepart> {
    const sparepart = await this.prisma.sparepart.create({
      data,
    });
    return sparepart as ISparepart;
  }

  async findAll(): Promise<ISparepart[]> {
    const spareparts = await this.prisma.sparepart.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return spareparts as ISparepart[];
  }

  async findById(id: string): Promise<ISparepart | null> {
    const sparepart = await this.prisma.sparepart.findUnique({
      where: { id },
    });
    return sparepart as ISparepart | null;
  }

  async findBySku(sku: string): Promise<ISparepart | null> {
    const sparepart = await this.prisma.sparepart.findUnique({
      where: { sku },
    });
    return sparepart as ISparepart | null;
  }
}
