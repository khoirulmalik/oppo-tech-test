export class WarehouseStockResponseDto {
  id: string;
  warehouseId: string;
  sparepartId: string;
  currentStock: number;
  updatedAt: Date;

  constructor(partial: Partial<WarehouseStockResponseDto>) {
    Object.assign(this, partial);
  }
}

export class StockTransactionResponseDto {
  id: string;
  warehouseId: string;
  sparepartId: string;
  type: string;
  quantity: number;
  createdAt: Date;

  constructor(partial: Partial<StockTransactionResponseDto>) {
    Object.assign(this, partial);
  }
}
