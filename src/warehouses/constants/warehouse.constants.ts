export const WAREHOUSE_ERROR_MESSAGES = {
  ALREADY_EXISTS: (code: string) =>
    `Warehouse with code ${code} already exists`,
  NOT_FOUND: (id: string) => `Warehouse with ID ${id} not found`,
  INVALID_CODE: 'Warehouse code must be alphanumeric and can contain hyphens',
  INVALID_NAME: 'Warehouse name is required',
} as const;

export const WAREHOUSE_VALIDATION = {
  NAME_MIN_LENGTH: 3,
  NAME_MAX_LENGTH: 100,
  CODE_MIN_LENGTH: 2,
  CODE_MAX_LENGTH: 20,
  CODE_PATTERN: /^[A-Z0-9-]+$/,
} as const;

export const WAREHOUSE_MESSAGES = {
  CREATED_SUCCESS: 'Warehouse created successfully',
  UPDATED_SUCCESS: 'Warehouse updated successfully',
  DELETED_SUCCESS: 'Warehouse deleted successfully',
} as const;
