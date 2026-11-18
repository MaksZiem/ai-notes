import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({
    description: 'Ścieżka do wgranego obrazu',
    example: '/uploads/3f1c9c2e-8a4b-4c1d-9e2f-1a2b3c4d5e6f.png',
  })
  url: string;
}
