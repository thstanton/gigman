import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

// #987 journey ④ ("the drinks set is downgraded"): the Band sheet's "What they play…" is a
// checkbox list, so the honest write is *set the link set*, not "unlink one". Unchecking a segment
// is this call with one fewer id. Chairs are never touched — a Lineup losing a segment keeps its
// seats, its people, their tokens and their confirmations (ADR-0081 §4).
export class UpdateLineupSegmentsDto {
  @ApiProperty({
    type: [String],
    description:
      'The complete set of segments (booking-level Package ids) this Lineup plays, replacing ' +
      'whatever it played before. Empty leaves the Lineup standing with no segments.',
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  packageIds!: string[];
}
