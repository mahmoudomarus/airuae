import { IsString, IsArray, IsOptional, IsUUID } from 'class-validator';

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsArray()
  @IsUUID(4, { each: true })
  participantIds: string[];

  @IsOptional()
  @IsUUID(4)
  propertyId?: string;

  @IsOptional()
  @IsUUID(4)
  bookingId?: string;

  @IsOptional()
  @IsString()
  initialMessage?: string;
}
