export interface IBaseEntity {
  id: string;
  createdAt: Date;
}

export interface IBaseEntityWithUpdate extends IBaseEntity {
  updatedAt: Date;
}
