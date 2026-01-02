export class WarehouseResponseDto {
  id: string;
  name: string;
  code: string;
  createdAt: Date;

  constructor(partial: Partial<WarehouseResponseDto>) {
    Object.assign(this, partial);
  }
}
