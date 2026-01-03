export interface IBaseRepository<T, CreateDto> {
  create(data: CreateDto): Promise<T>;
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
}
