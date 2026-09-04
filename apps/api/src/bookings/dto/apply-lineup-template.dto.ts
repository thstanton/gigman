import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class ApplyLineupTemplateDto {
  @ApiProperty({ example: 'uuid-of-lineup-template' })
  @IsUUID()
  lineupTemplateId!: string;

  // #987: a Lineup plays a *set* of segments, so applying targets a set. An empty array is not a
  // missing value — it is the whole-gig/package-less band (ADR-0081 §4), which is why this is
  // required rather than optional: "plays everything" and "plays nothing yet" are both `[]`, and
  // omitting the field would make a third, ambiguous state.
  @ApiProperty({
    type: [String],
    description:
      'Segments (booking-level Package ids) the resulting Lineup plays. Empty targets the ' +
      'package-less/whole-gig band — one code path, no special case (ADR-0081 §4).',
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  packageIds!: string[];
}
