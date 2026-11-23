import { isUUID } from 'class-validator';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '@hocuspocus/server';
import * as Y from 'yjs';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { readSessionToken } from 'src/users/session-cookie';
import { NotesService } from 'src/notes/notes.service';
import { Note } from 'src/notes/entities/note.entity';
import { AccessLevel, hasAccess } from 'src/enums/access-level.enum';

@Injectable()
export class YjsGateway implements OnModuleInit {
  private readonly logger = new Logger(YjsGateway.name);

  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly notesService: NotesService,
    @InjectRepository(Note) private readonly noteRepo: Repository<Note>,
  ) {}

  async onModuleInit() {
    const port = Number(this.config.getOrThrow<string>('YJS_PORT'));
    const server = new Server({
      port,

      onAuthenticate: async ({
        documentName,
        requestHeaders,
        connectionConfig,
      }) => {
        const origin = requestHeaders.get('origin');
        if (origin && origin !== this.config.get<string>('FRONTEND_URL')) {
          throw new Error('Niedozwolony origin');
        }
        const noteId = documentName;
        const token = readSessionToken(requestHeaders.get('cookie'));
        if (!token || !isUUID(noteId)) {
          throw new Error('Brak cookie sesji lub noteId');
        }

        const payload = await this.jwtService.verifyAsync<{ id: string }>(
          token,
        );
        const user = await this.usersService.findOne(payload.id);
        if (!user) {
          throw new Error('Nieprawidłowy użytkownik');
        }
        const note = await this.noteRepo.findOneBy({ id: noteId });
        if (!note) {
          throw new Error('Note not exists');
        }
        const accessLevel = await this.notesService.getAccessLevel(
          noteId,
          note.projectId,
          user.id,
          user.role,
        );
        connectionConfig.readOnly = !hasAccess(accessLevel, AccessLevel.EDIT);
        return { userId: user.id };
      },

      onLoadDocument: async ({ documentName }) => {
        const note = await this.noteRepo.findOneBy({ id: documentName });
        const doc = new Y.Doc();
        if (note?.yjsState) {
          Y.applyUpdate(doc, note.yjsState);
        }
        return doc;
      },

      onStoreDocument: async ({ documentName, document }) => {
        const state = Buffer.from(Y.encodeStateAsUpdate(document));
        await this.noteRepo.update({ id: documentName }, { yjsState: state });
      },
    });

    await server.listen();
    this.logger.log(`Yjs (Hocuspocus) nasłuchuje na porcie ${port}`);
  }
}
