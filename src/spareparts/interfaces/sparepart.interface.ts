import { IBaseEntityWithUpdate } from '../../shared/interfaces';

export interface ISparepart extends IBaseEntityWithUpdate {
  name: string;
  sku: string;
}

export interface ICreateSparepart {
  name: string;
  sku: string;
}

export interface ISparepartRepository {
  create(data: ICreateSparepart): Promise<ISparepart>;
  findAll(): Promise<ISparepart[]>;
  findById(id: string): Promise<ISparepart | null>;
  findBySku(sku: string): Promise<ISparepart | null>;
}

export interface ISparepartService {
  create(data: ICreateSparepart): Promise<ISparepart>;
  findAll(): Promise<ISparepart[]>;
  findOne(id: string): Promise<ISparepart>;
}
