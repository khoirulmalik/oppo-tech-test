import { IsNotEmpty, IsString, IsInt, Min, Max } from 'class-validator';
import { STOCK_VALIDATION } from '../constants';

export class StockOutDto {
  @IsNotEmpty()
  @IsString()
  warehouseId: string;

  @IsNotEmpty()
  @IsString()
  sparepartId: string;

  @IsNotEmpty()
  @IsInt()
  @Min(STOCK_VALIDATION.MIN_QUANTITY)
  @Max(STOCK_VALIDATION.MAX_QUANTITY)
  quantity: number;
}
