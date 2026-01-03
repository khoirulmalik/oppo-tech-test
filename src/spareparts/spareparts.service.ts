import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateSparepartDto } from './dto/create-sparepart.dto';
import { SparepartResponseDto } from './dto/sparepart-response.dto';
import { SparepartsRepository } from './spareparts.repository';
import { ISparepartService } from './interfaces/sparepart.interface';
import { SPAREPART_ERROR_MESSAGES } from './constants/sparepart.constants';

@Injectable()
export class SparepartsService implements ISparepartService {
  constructor(private readonly repository: SparepartsRepository) {}

  async create(
    createSparepartDto: CreateSparepartDto,
  ): Promise<SparepartResponseDto> {
    const existingSparepart = await this.repository.findBySku(
      createSparepartDto.sku,
    );

    if (existingSparepart) {
      throw new ConflictException(
        SPAREPART_ERROR_MESSAGES.ALREADY_EXISTS(createSparepartDto.sku),
      );
    }

    const sparepart = await this.repository.create(createSparepartDto);

    return new SparepartResponseDto(sparepart);
  }

  async findAll(): Promise<SparepartResponseDto[]> {
    const spareparts = await this.repository.findAll();

    return spareparts.map((sparepart) => new SparepartResponseDto(sparepart));
  }

  async findOne(id: string): Promise<SparepartResponseDto> {
    const sparepart = await this.repository.findById(id);

    if (!sparepart) {
      throw new NotFoundException(SPAREPART_ERROR_MESSAGES.NOT_FOUND(id));
    }

    return new SparepartResponseDto(sparepart);
  }
}
