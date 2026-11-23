import {
  ArgumentMetadata,
  BadRequestException,
  HttpStatus,
  Injectable,
  ParseUUIDPipe,
} from '@nestjs/common';
import { errorBody } from '../error-body';

@Injectable()
export class ParseIdPipe extends ParseUUIDPipe {
  async transform(value: string, metadata: ArgumentMetadata): Promise<string> {
    try {
      return await super.transform(value, metadata);
    } catch {
      const param = metadata.data ?? 'id';
      throw new BadRequestException(
        errorBody(
          HttpStatus.BAD_REQUEST,
          'INVALID_ID',
          `Parameter ${param} must be a UUID`,
          { param },
        ),
      );
    }
  }
}
