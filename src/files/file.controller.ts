import {
  Controller,
  Get,
  Param,
  Res,
  HttpStatus,
  Post,
  Body,
} from '@nestjs/common';
import { Response } from 'express';
import { FileService } from './file.service';

@Controller('files')
export class FilesController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  async uploadFile(
    @Body('fileData') fileData: string,
    @Body('filename') filename: string,
  ) {
    const fileUrl = await this.fileService.saveFile(fileData, filename);
    return { fileUrl };
  }

  @Get(':id')
  async getFile(@Param('id') id: string, @Res() res: Response) {
    try {
      const fileStream = await this.fileService.getFileById(id);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error in getFile:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('An error occurred');
    }
  }
}
