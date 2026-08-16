import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';

export const UPLOAD_DIR = join(process.cwd(), 'uploads');
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

@ApiTags('Uploads')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
@Controller('uploads')
export class UploadsController {
  // ──────────────────────────────────────────────
  // POST /uploads/image
  // ──────────────────────────────────────────────
  @Post('image')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Wgraj obraz do treści notatki',
    description:
      'Przyjmuje pojedynczy plik graficzny (PNG/JPEG/GIF/WEBP, maks. 5MB) i zapisuje go lokalnie na dysku serwera.',
  })
  @ApiResponse({
    status: 201,
    description: 'Plik zapisany — zwraca ścieżkę URL',
    schema: { example: { url: '/uploads/3f1c9c2e-....png' } },
  })
  @ApiResponse({ status: 400, description: 'Brak pliku lub niedozwolony typ/rozmiar' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, callback) => {
          callback(null, `${randomUUID()}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          callback(
            new BadRequestException(
              'Dozwolone są tylko pliki graficzne (PNG, JPEG, GIF, WEBP)',
            ),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Brak pliku');
    }
    return { url: `/uploads/${file.filename}` };
  }
}
