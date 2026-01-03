import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StockService } from './stock.service';
import {
  StockInDto,
  StockOutDto,
  WarehouseStockResponseDto,
  StockTransactionResponseDto,
} from './dto';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('in')
  @HttpCode(HttpStatus.CREATED)
  async stockIn(
    @Body() stockInDto: StockInDto,
  ): Promise<StockTransactionResponseDto> {
    return this.stockService.stockIn(stockInDto);
  }

  @Post('out')
  @HttpCode(HttpStatus.CREATED)
  async stockOut(
    @Body() stockOutDto: StockOutDto,
  ): Promise<StockTransactionResponseDto> {
    return this.stockService.stockOut(stockOutDto);
  }

  @Get()
  async getStock(
    @Query('warehouseId') warehouseId: string,
    @Query('sparepartId') sparepartId: string,
  ): Promise<WarehouseStockResponseDto> {
    return this.stockService.getStock(warehouseId, sparepartId);
  }

  @Get('history')
  async getStockHistory(
    @Query('warehouseId') warehouseId?: string,
    @Query('sparepartId') sparepartId?: string,
  ): Promise<StockTransactionResponseDto[]> {
    return this.stockService.getStockHistory(warehouseId, sparepartId);
  }
}
