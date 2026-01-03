import { IBaseEntityWithUpdate } from '../../shared/interfaces';
import { TransactionType } from '@prisma/client';

export interface IWarehouseStock extends IBaseEntityWithUpdate {
  warehouseId: string;
  sparepartId: string;
  currentStock: number;
}

export interface IStockTransaction {
  id: string;
  warehouseId: string;
  sparepartId: string;
  type: TransactionType;
  quantity: number;
  createdAt: Date;
}

export interface IStockIn {
  warehouseId: string;
  sparepartId: string;
  quantity: number;
}

export interface IStockOut {
  warehouseId: string;
  sparepartId: string;
  quantity: number;
}

export interface IStockRepository {
  findStock(
    warehouseId: string,
    sparepartId: string,
  ): Promise<IWarehouseStock | null>;
  findStockWithLock(
    warehouseId: string,
    sparepartId: string,
  ): Promise<IWarehouseStock | null>;
  createStock(data: {
    warehouseId: string;
    sparepartId: string;
    currentStock: number;
  }): Promise<IWarehouseStock>;
  updateStock(id: string, currentStock: number): Promise<IWarehouseStock>;
  createTransaction(data: {
    warehouseId: string;
    sparepartId: string;
    type: TransactionType;
    quantity: number;
  }): Promise<IStockTransaction>;
  getStockHistory(
    warehouseId?: string,
    sparepartId?: string,
  ): Promise<IStockTransaction[]>;
}

export interface IStockService {
  stockIn(data: IStockIn): Promise<IStockTransaction>;
  stockOut(data: IStockOut): Promise<IStockTransaction>;
  getStock(warehouseId: string, sparepartId: string): Promise<IWarehouseStock>;
  getStockHistory(
    warehouseId?: string,
    sparepartId?: string,
  ): Promise<IStockTransaction[]>;
}
