export interface IWarehouse {
  id: string;
  name: string;
  code: string;
  createdAt: Date;
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
