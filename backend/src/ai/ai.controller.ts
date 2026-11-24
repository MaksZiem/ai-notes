import { ParseIdPipe } from 'src/common/pipes/parse-id.pipe';
import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  BadRequestErrorDto,
  ForbiddenErrorDto,
  NotFoundErrorDto,
  TooManyRequestsErrorDto,
  UnauthorizedErrorDto,
} from 'src/common/swagger/error-response.dto';
import { SESSION_AUTH } from 'src/common/swagger/swagger.setup';
import {
  ContentDto,
  ContinuationDto,
  GeneratedContentDto,
  GeneratedTextDto,
  KeywordsDto,
  PromptDto,
  RewriteDto,
  RewriteResultDto,
  SummaryDto,
  TextDto,
  TitleDto,
} from './dtos/ai.dto';
import { AiService, type RewriteMode } from './ai.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { AiLimitGuard } from 'src/ai-usage/ai-limit.guard';
import { NotesService } from 'src/notes/notes.service';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/user.entity';
import { errorBody } from '../common/error-body';

const REWRITE_MODES: RewriteMode[] = [
  'fix',
  'improve',
  'shorten',
  'expand',
  'custom',
];

@UseGuards(AuthGuard, AiLimitGuard)
@ApiTags('ai')
@ApiCookieAuth(SESSION_AUTH)
@ApiUnauthorizedResponse({
  description: 'Brak lub nieważne cookie sesji',
  type: UnauthorizedErrorDto,
})
@ApiTooManyRequestsResponse({
  description:
    'Wyczerpany limit Gemini (kod AI_QUOTA_EXCEEDED) albo dzienny limit wywołań AI użytkownika (kod AI_DAILY_LIMIT)',
  type: TooManyRequestsErrorDto,
})
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly notesService: NotesService,
  ) {}

  @Post('ping')
  @ApiOperation({ summary: 'Test połączenia z AI' })
  @ApiCreatedResponse({
    description: 'Odpowiedź modelu',
    type: GeneratedTextDto,
  })
  @ApiBody({ type: PromptDto })
  async ping(@Body('prompt') prompt: string) {
    const text = await this.aiService.generateText(prompt);
    return { text };
  }

  @Post('generate')
  @ApiOperation({ summary: 'Wygeneruj treść notatki z polecenia' })
  @ApiCreatedResponse({
    description: 'Wygenerowana treść',
    type: GeneratedContentDto,
  })
  @ApiBody({ type: PromptDto })
  @ApiBadRequestResponse({
    description: 'Brak polecenia (kod INSTRUCTION_REQUIRED)',
    type: BadRequestErrorDto,
  })
  async generate(@Body('prompt') prompt: string) {
    if (!prompt?.trim()) {
      throw new BadRequestException(
        errorBody(
          HttpStatus.BAD_REQUEST,
          'INSTRUCTION_REQUIRED',
          'Instruction is required',
        ),
      );
    }
    const content = await this.aiService.generateNoteContent(prompt);
    return { content };
  }

  @Post('continue')
  @ApiOperation({ summary: 'Kontynuuj pisanie tekstu' })
  @ApiCreatedResponse({
    description: 'Dalszy ciąg tekstu',
    type: ContinuationDto,
  })
  @ApiBody({ type: TextDto })
  @ApiBadRequestResponse({
    description: 'Brak tekstu (kod TEXT_REQUIRED)',
    type: BadRequestErrorDto,
  })
  async continue(@Body('text') text: string) {
    if (!text?.trim()) {
      throw new BadRequestException(
        errorBody(HttpStatus.BAD_REQUEST, 'TEXT_REQUIRED', 'Text is required'),
      );
    }
    const continuation = await this.aiService.continueText(text);
    return { continuation };
  }

  @Post('rewrite')
  @ApiOperation({ summary: 'Przepisz zaznaczony tekst' })
  @ApiCreatedResponse({
    description: 'Przepisany tekst',
    type: RewriteResultDto,
  })
  @ApiBody({ type: RewriteDto })
  @ApiBadRequestResponse({
    description:
      'Brak tekstu (TEXT_REQUIRED), nieznany tryb (INVALID_MODE) lub brak instrukcji dla trybu custom (INSTRUCTION_REQUIRED)',
    type: BadRequestErrorDto,
  })
  async rewrite(
    @Body('text') text: string,
    @Body('mode') mode: RewriteMode,
    @Body('instruction') instruction?: string,
  ) {
    if (!text?.trim()) {
      throw new BadRequestException(
        errorBody(HttpStatus.BAD_REQUEST, 'TEXT_REQUIRED', 'Text is required'),
      );
    }
    if (!REWRITE_MODES.includes(mode)) {
      throw new BadRequestException(
        errorBody(HttpStatus.BAD_REQUEST, 'INVALID_MODE', 'Invalid mode'),
      );
    }
    if (mode === 'custom' && !instruction?.trim()) {
      throw new BadRequestException(
        errorBody(
          HttpStatus.BAD_REQUEST,
          'INSTRUCTION_REQUIRED',
          'Instruction is required',
        ),
      );
    }

    const result = await this.aiService.rewriteText(text, mode, instruction);
    return { result };
  }

  @Post('title')
  @ApiOperation({ summary: 'Zaproponuj tytuł notatki' })
  @ApiCreatedResponse({ description: 'Proponowany tytuł', type: TitleDto })
  @ApiBody({ type: ContentDto })
  @ApiBadRequestResponse({
    description: 'Brak treści (kod CONTENT_REQUIRED)',
    type: BadRequestErrorDto,
  })
  async generateTitle(@Body('content') content: string) {
    if (!content?.trim()) {
      throw new BadRequestException(
        errorBody(
          HttpStatus.BAD_REQUEST,
          'CONTENT_REQUIRED',
          'Content is required',
        ),
      );
    }
    const title = await this.aiService.generateTitle(content);
    return { title };
  }

  @Post('projects/:projectId/summary')
  @ApiOperation({ summary: 'Streść wszystkie notatki projektu' })
  @ApiCreatedResponse({
    description: 'Streszczenie projektu',
    type: SummaryDto,
  })
  @ApiParam({
    name: 'projectId',
    type: String,
    format: 'uuid',
    example: '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8a9b0c',
    description: 'ID projektu',
  })
  @ApiBadRequestResponse({
    description: 'Projekt nie ma notatek (kod PROJECT_HAS_NO_NOTES)',
    type: BadRequestErrorDto,
  })
  @ApiForbiddenResponse({
    description: 'Brak dostępu do projektu',
    type: ForbiddenErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'Projekt nie istnieje (kod PROJECT_NOT_FOUND)',
    type: NotFoundErrorDto,
  })
  async generateProjectSummary(
    @Param('projectId', ParseIdPipe) projectId: string,
    @CurrentUser() user: User,
  ) {
    const notes = await this.notesService.findAllNotesInProject(
      projectId,
      user.id,
      user.role,
    );
    if (!notes.length) {
      throw new BadRequestException(
        errorBody(
          HttpStatus.BAD_REQUEST,
          'PROJECT_HAS_NO_NOTES',
          'The project has no notes yet',
        ),
      );
    }
    const summary = await this.aiService.summarizeProject(notes);
    return { summary };
  }

  @Post('keywords')
  @ApiOperation({ summary: 'Zaproponuj słowa kluczowe' })
  @ApiCreatedResponse({
    description: 'Proponowane słowa kluczowe',
    type: KeywordsDto,
  })
  @ApiBody({ type: ContentDto })
  @ApiBadRequestResponse({
    description: 'Brak treści (kod CONTENT_REQUIRED)',
    type: BadRequestErrorDto,
  })
  async suggestKeywords(@Body('content') content: string) {
    if (!content?.trim()) {
      throw new BadRequestException(
        errorBody(
          HttpStatus.BAD_REQUEST,
          'CONTENT_REQUIRED',
          'Content is required',
        ),
      );
    }
    const keywords = await this.aiService.suggestKeywords(content);
    return { keywords };
  }
}
