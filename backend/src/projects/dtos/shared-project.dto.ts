import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccessLevel } from 'src/enums/access-level.enum';

export class SharedProjectInfoDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Redesign strony głównej' })
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description: string | null;
}

export class InviterDto {
  @ApiProperty({ example: 'Jan' })
  name: string;

  @ApiProperty({ example: 'Kowalski' })
  surname: string;
}

export class SharedProjectDto {
  @ApiProperty({
    description: 'Podstawowe dane projektu, bez notatek',
    type: () => SharedProjectInfoDto,
  })
  project: SharedProjectInfoDto;

  @ApiPropertyOptional({
    description: 'Kto zaprosił',
    type: () => InviterDto,
    nullable: true,
  })
  invitedBy: InviterDto | null;

  @ApiProperty({ enum: AccessLevel })
  accessLevel: AccessLevel;
}
