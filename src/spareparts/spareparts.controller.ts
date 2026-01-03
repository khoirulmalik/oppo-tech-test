import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SparepartsService } from './spareparts.service';
import { CreateSparepartDto } from './dto/create-sparepart.dto';
import { SparepartResponseDto } from './dto/sparepart-response.dto';

@Controller('spareparts')
export class SparepartsController {
  constructor(private readonly sparepartsService: SparepartsService) {}

  @Post()
  async create(
    @Body() createSparepartDto: CreateSparepartDto,
  ): Promise<SparepartResponseDto> {
    return this.sparepartsService.create(createSparepartDto);
  }

  @Get()
  async findAll(): Promise<SparepartResponseDto[]> {
    return this.sparepartsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SparepartResponseDto> {
    return this.sparepartsService.findOne(id);
  }
}
