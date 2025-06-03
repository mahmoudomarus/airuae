import { IsDateString, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateBookingDto {
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsNumber()
  @Min(0)
  totalPrice: number;

  @IsNumber()
  @Min(1)
  nights: number;
}
