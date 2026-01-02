import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { WarehouseResponseDto } from './dto/warehouse-response.dto';
import { WarehousesRepository } from './warehouses.repository';
import { IWarehouseService } from './interfaces/warehouse.interface';
import { WAREHOUSE_ERROR_MESSAGES } from './constants/warehouse.constants';

@Injectable()
export class WarehousesService implements IWarehouseService {
  constructor(private readonly repository: WarehousesRepository) {}

  async create(
    createWarehouseDto: CreateWarehouseDto,
  ): Promise<WarehouseResponseDto> {
    const existingWarehouse = await this.repository.findByCode(
      createWarehouseDto.code,
    );

    if (existingWarehouse) {
      throw new ConflictException(
        WAREHOUSE_ERROR_MESSAGES.ALREADY_EXISTS(createWarehouseDto.code),
      );
    }

    const warehouse = await this.repository.create(createWarehouseDto);

    return new WarehouseResponseDto(warehouse);
  }

  async findAll(): Promise<WarehouseResponseDto[]> {
    const warehouses = await this.repository.findAll();

    return warehouses.map((warehouse) => new WarehouseResponseDto(warehouse));
  }

  async findOne(id: string): Promise<WarehouseResponseDto> {
    const warehouse = await this.repository.findById(id);

    if (!warehouse) {
      throw new NotFoundException(WAREHOUSE_ERROR_MESSAGES.NOT_FOUND(id));
    }

    return new WarehouseResponseDto(warehouse);
  }
}
