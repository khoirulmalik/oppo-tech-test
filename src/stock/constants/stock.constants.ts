export const STOCK_ERROR_MESSAGES = {
  WAREHOUSE_NOT_FOUND: (id: string) => `Warehouse with ID ${id} not found`,
  SPAREPART_NOT_FOUND: (id: string) => `Sparepart with ID ${id} not found`,
  STOCK_NOT_FOUND: (warehouseId: string, sparepartId: string) =>
    `Stock not found for warehouse ${warehouseId} and sparepart ${sparepartId}`,
  INSUFFICIENT_STOCK: (available: number, requested: number) =>
    `Insufficient stock. Available: ${available}, Requested: ${requested}`,
  INVALID_QUANTITY: 'Quantity must be greater than 0',
} as const;

export const STOCK_VALIDATION = {
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 999999,
} as const;

export const STOCK_MESSAGES = {
  STOCK_IN_SUCCESS: 'Stock added successfully',
  STOCK_OUT_SUCCESS: 'Stock removed successfully',
} as const;
