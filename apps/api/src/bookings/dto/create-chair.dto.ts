import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateChairDto {
  @ApiProperty({ example: 'Saxophone', description: 'Free-text seat role.' })
  @IsString()
  @IsNotEmpty()
  role!: string;

  // #987: was `packageId`. A chair is seated in a *Lineup*, never in a segment — ADR-0081 §1, "only
  // an instance can be pointed at". The old segment-keyed lookup could not survive a Lineup playing
  // several segments, and its "no links" probe could no longer tell the whole-gig band from a band
  // that had just lost its last segment. Omitted, a fresh unnamed Lineup is created for this chair
  // (the musician who has no lineup templates and adds one part at a time, #884). `order` (position
  // within the Lineup) is computed server-side.
  @ApiPropertyOptional({
    description:
      'Lineup to seat this chair in (ADR-0081 §1). Omit to start a new unnamed Lineup holding ' +
      'just this chair — the one-part-at-a-time path (#884).',
  })
  @IsOptional()
  @IsUUID()
  lineupId?: string;
}
