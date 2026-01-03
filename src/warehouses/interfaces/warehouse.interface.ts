import { IBaseEntity } from '../../shared/interfaces';

export interface IWarehouse extends IBaseEntity {
  name: string;
  code: string;
}

export interface ICreateWarehouse {
  name: string;
  code: string;
}

export interface IWarehouseRepository {
  create(data: ICreateWarehouse): Promise<IWarehouse>;
  findAll(): Promise<IWarehouse[]>;
  findById(id: string): Promise<IWarehouse | null>;
  findByCode(code: string): Promise<IWarehouse | null>;
}

export interface IWarehouseService {
  create(data: ICreateWarehouse): Promise<IWarehouse>;
  findAll(): Promise<IWarehouse[]>;
  findOne(id: string): Promise<IWarehouse>;
}
