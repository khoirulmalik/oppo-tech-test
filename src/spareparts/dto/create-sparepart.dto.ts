import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { SPAREPART_VALIDATION } from '../constants/sparepart.constants';

export class CreateSparepartDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(SPAREPART_VALIDATION.NAME_MIN_LENGTH)
  @MaxLength(SPAREPART_VALIDATION.NAME_MAX_LENGTH)
  name: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(SPAREPART_VALIDATION.SKU_MIN_LENGTH)
  @MaxLength(SPAREPART_VALIDATION.SKU_MAX_LENGTH)
  @Matches(SPAREPART_VALIDATION.SKU_PATTERN, {
    message: 'SKU must be uppercase alphanumeric with hyphens only',
  })
  sku: string;
}
