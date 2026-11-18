import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { AccessLevel } from 'src/enums/access-level.enum';

export class CreateShareLinkDto {
  @ApiPropertyOptional({ enum: AccessLevel, example: AccessLevel.VIEW })
  @IsEnum(AccessLevel)
  @IsOptional()
  accessLevel?: AccessLevel;

  @ApiPropertyOptional({
    example: 7,
    description: 'Za ile dni link wygaśnie. Brak = bez wygasania.',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  expiresInDays?: number;

  @ApiPropertyOptional({
    example: 'ktos@example.com',
    description: 'Jeśli podane, link zostanie od razu wysłany mailem.',
  })
  @IsEmail()
  @IsOptional()
  email?: string;
}
