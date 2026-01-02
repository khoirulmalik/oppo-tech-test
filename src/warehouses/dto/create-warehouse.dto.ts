import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { WAREHOUSE_VALIDATION } from '../constants/warehouse.constants';

export class CreateWarehouseDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(WAREHOUSE_VALIDATION.NAME_MIN_LENGTH)
  @MaxLength(WAREHOUSE_VALIDATION.NAME_MAX_LENGTH)
  name: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(WAREHOUSE_VALIDATION.CODE_MIN_LENGTH)
  @MaxLength(WAREHOUSE_VALIDATION.CODE_MAX_LENGTH)
  @Matches(WAREHOUSE_VALIDATION.CODE_PATTERN, {
    message: 'Code must be uppercase alphanumeric with hyphens only',
  })
  code: string;
}
