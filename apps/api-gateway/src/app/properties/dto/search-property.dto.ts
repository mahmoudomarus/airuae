import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchPropertyDto {
  @IsString()
  @IsOptional()
  city?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  bedrooms?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  bathrooms?: number;

  @IsArray()
  @IsOptional()
  amenities?: string[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  skip?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  take?: number;
}
