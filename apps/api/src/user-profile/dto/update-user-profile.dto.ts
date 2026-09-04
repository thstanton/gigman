import { ApiPropertyOptional } from '@nestjs/swagger';
import { Allow, IsBoolean, IsInt, IsNumber, IsObject, IsOptional, IsString, Max, Min, ValidateIf } from 'class-validator';

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ example: '123 High Street', nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  addressLine1?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  addressLine2?: string | null;

  @ApiPropertyOptional({ example: 'London', nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  city?: string | null;

  @ApiPropertyOptional({ example: 'Greater London', nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  county?: string | null;

  @ApiPropertyOptional({ example: 'SW1A 1AA', nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  postcode?: string | null;

  @ApiPropertyOptional({ example: 'GB', nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  country?: string | null;

  @ApiPropertyOptional({ example: 51.5014, nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsNumber()
  latitude?: number | null;

  @ApiPropertyOptional({ example: -0.1419, nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsNumber()
  longitude?: number | null;

  @ApiPropertyOptional({ example: 'ChIJdd4hrwug2EcRmSrV3Vo6llI', nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  placeId?: string | null;

  @ApiPropertyOptional({ example: '123 High Street', nullable: true, type: String, description: 'Travel Base — where the musician sets off from for gigs (ADR-0082)' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  travelBaseAddressLine1?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  travelBaseAddressLine2?: string | null;

  @ApiPropertyOptional({ example: 'London', nullable: true, type: String })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  travelBaseCity?: string | null;

  @ApiPropertyOptional({ example: 'Greater London', nullable: true, type: String })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  travelBaseCounty?: string | null;

  @ApiPropertyOptional({ example: 'SW1A 1AA', nullable: true, type: String })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  travelBasePostcode?: string | null;

  @ApiPropertyOptional({ example: 'GB', nullable: true, type: String })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  travelBaseCountry?: string | null;

  @ApiPropertyOptional({ example: 51.5014, nullable: true, type: Number })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsNumber()
  travelBaseLatitude?: number | null;

  @ApiPropertyOptional({ example: -0.1419, nullable: true, type: Number })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsNumber()
  travelBaseLongitude?: number | null;

  @ApiPropertyOptional({ example: 'ChIJdd4hrwug2EcRmSrV3Vo6llI', nullable: true, type: String })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  travelBasePlaceId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  bankDetails?: string | null;

  @ApiPropertyOptional({ example: 'GB123456789', nullable: true })
  @IsOptional()
  @IsString()
  vatNumber?: string | null;

  @ApiPropertyOptional({ example: 20, description: 'VAT rate as a percentage (0–100)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  vatRate?: number;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @IsInt()
  @Min(0)
  defaultPaymentTermsDays?: number;

  @ApiPropertyOptional({ example: 30, description: 'Default deposit percentage (1–100)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  depositPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  digestEmailEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  songRequestFormEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'User preferences JSON — merged with existing value on PATCH',
    example: {
      reminderLeadDays: 7,
      invoiceNumberFormat: { prefix: 'INV', includeYear: true, paddingWidth: 3 },
      dismissedHints: ['booking-concept-card'],
    },
  })
  @IsOptional()
  @IsObject()
  @Allow()
  preferences?: Record<string, unknown>;
}
