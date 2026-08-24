import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '@hocuspocus/server';
import * as Y from 'yjs';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { NotesService } from 'src/notes/notes.service';
import { Note } from 'src/notes/entities/note.entity';
import { AccessLevel, hasAccess } from 'src/enums/access-level.enum';

const YJS_PORT = 1234;

@Injectable()
export class YjsGateway implements OnModuleInit {
  private readonly logger = new Logger(YjsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly notesService: NotesService,
    @InjectRepository(Note) private readonly noteRepo: Repository<Note>,
  ) {}

  async onModuleInit() {
    const server = new Server({
      port: YJS_PORT,

      onAuthenticate: async ({ token, documentName, connectionConfig }) => {
        const noteId = Number(documentName);
        if (!token || !noteId) {
          throw new Error('Brak tokenu lub noteId');
        }

        const payload = await this.jwtService.verifyAsync(token);
        const user = await this.usersService.findOne(payload.id);
        if (!user) {
          throw new Error('Nieprawidłowy użytkownik');
        }
        const note = await this.noteRepo.findOneBy({ id: noteId });
        if (!note) {
          throw new Error('Note not exists');
        }
        // Wymaga co najmniej VIEW — rzuci, jeśli caller nie ma żadnego dostępu.
        const accessLevel = await this.notesService.getAccessLevel(
          noteId,
          note.projectId,
          user.id,
          user.role,
        );
        // Przy samym VIEW połączenie zostaje oznaczone jako readOnly — Hocuspocus
        // wtedy po cichu odrzuca każdą przychodzącą aktualizację dokumentu, więc
        // klient dostaje żywe zmiany, ale nie może nic zapisać.
        connectionConfig.readOnly = !hasAccess(accessLevel, AccessLevel.EDIT);
        return { userId: user.id };
      },

      onLoadDocument: async ({documentName}) => {
        const note = await this.noteRepo.findOneBy({id: Number(documentName)})
        const doc = new Y.Doc()
        if (note?.yjsState) {
          Y.applyUpdate(doc, note.yjsState);
        }
        return doc;
      },

      onStoreDocument: async ({documentName, document}) => {
        const state = Buffer.from(Y.encodeStateAsUpdate(document))
        await this.noteRepo.update({id: Number(documentName)}, {yjsState: state})
      }
    });

    await server.listen()
    this.logger.log(`Yjs (Hocuspocus) nasłuchuje na porcie ${YJS_PORT}`);
  }
}
