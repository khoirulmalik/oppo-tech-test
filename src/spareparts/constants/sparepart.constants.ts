export const SPAREPART_ERROR_MESSAGES = {
  ALREADY_EXISTS: (sku: string) => `Sparepart with SKU ${sku} already exists`,
  NOT_FOUND: (id: string) => `Sparepart with ID ${id} not found`,
  INVALID_SKU: 'Sparepart SKU must be alphanumeric and can contain hyphens',
  INVALID_NAME: 'Sparepart name is required',
} as const;

export const SPAREPART_VALIDATION = {
  NAME_MIN_LENGTH: 3,
  NAME_MAX_LENGTH: 200,
  SKU_MIN_LENGTH: 2,
  SKU_MAX_LENGTH: 50,
  SKU_PATTERN: /^[A-Z0-9-]+$/,
} as const;

export const SPAREPART_MESSAGES = {
  CREATED_SUCCESS: 'Sparepart created successfully',
  UPDATED_SUCCESS: 'Sparepart updated successfully',
  DELETED_SUCCESS: 'Sparepart deleted successfully',
} as const;
