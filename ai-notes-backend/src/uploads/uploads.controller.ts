import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, resolve } from 'path';
import { randomUUID } from 'crypto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  BadRequestErrorDto,
  UnauthorizedErrorDto,
} from 'src/common/swagger/error-response.dto';
import { BEARER_AUTH } from 'src/common/swagger/swagger.setup';
import { UploadResponseDto } from './dtos/upload-response.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { errorBody } from '../common/error-body';

export function uploadDir(): string {
  const dir = resolve(process.env.UPLOAD_DIR ?? 'uploads');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

@ApiTags('uploads')
@ApiBearerAuth(BEARER_AUTH)
@ApiUnauthorizedResponse({
  description: 'Brak tokenu lub token nieprawidłowy',
  type: UnauthorizedErrorDto,
})
@UseGuards(AuthGuard)
@Controller('uploads')
export class UploadsController {
  @Post('image')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Wgraj obraz do treści notatki',
    description:
      'Przyjmuje pojedynczy plik graficzny (PNG/JPEG/GIF/WEBP, maks. 5MB) i zapisuje go lokalnie na dysku serwera.',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, callback) => callback(null, uploadDir()),
        filename: (_req, file, callback) => {
          callback(null, `${randomUUID()}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          callback(
            new BadRequestException(
              errorBody(
                HttpStatus.BAD_REQUEST,
                'IMAGE_TYPE_UNSUPPORTED',
                'Only image files are allowed (PNG, JPEG, GIF, WEBP)',
              ),
            ),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  @ApiCreatedResponse({
    description: 'Obraz zapisany',
    type: UploadResponseDto,
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Brak pliku (FILE_REQUIRED), niedozwolony typ (IMAGE_TYPE_UNSUPPORTED) lub plik większy niż 5 MB',
    type: BadRequestErrorDto,
  })
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        errorBody(HttpStatus.BAD_REQUEST, 'FILE_REQUIRED', 'File is required'),
      );
    }
    return { url: `/uploads/${file.filename}` };
  }
}
