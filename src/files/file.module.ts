import { Module } from '@nestjs/common';
import { FilesController } from './file.controller';
import { FileService } from './file.service';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule],
  providers: [
    FileService,
  ],
  controllers: [FilesController],
  exports: [],
})
export class FilesModule {}
