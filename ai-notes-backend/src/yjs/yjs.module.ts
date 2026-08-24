import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Note } from 'src/notes/entities/note.entity';
import { NotesModule } from 'src/notes/notes.module';
import { YjsGateway } from './yjs.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Note]),  NotesModule],
  providers: [YjsGateway],
  exports: [YjsGateway]
})
export class YjsModule {}