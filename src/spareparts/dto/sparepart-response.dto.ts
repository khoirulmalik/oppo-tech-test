export class SparepartResponseDto {
  id: string;
  name: string;
  sku: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<SparepartResponseDto>) {
    Object.assign(this, partial);
  }
}
