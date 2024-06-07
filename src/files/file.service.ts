import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose, { Connection } from 'mongoose';
import { Readable } from 'stream';

@Injectable()
export class FileService {
  private bucket: mongoose.mongo.GridFSBucket;
  constructor(@InjectConnection() private readonly connection: Connection) {
    this.bucket = new mongoose.mongo.GridFSBucket(this.connection.db, {
      bucketName: 'uploads',
    });
  }

  async uploadFileFromBuffer(
    fileBuffer: Buffer,
    filename: string,
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const uploadStream = this.bucket.openUploadStream(filename, {
        metadata: { filename },
      });
      const readableStream = new Readable();
      readableStream.push(fileBuffer);
      readableStream.push(null);
      readableStream
        .pipe(uploadStream)
        .on('error', (error) => reject(error))
        .on('finish', function() {
          console.log('Done');                          
          console.log('fs.files._id:'+uploadStream.id)
          resolve(uploadStream.id.toString());
        });
    });
  }

  async saveFile(fileData: string, filename: string): Promise<string> {
    try {
      const base64Data = fileData.replace(/^data:\w+\/\w+;base64,/, '');
      const fileBuffer = Buffer.from(base64Data, 'base64');
      const fileId = await this.uploadFileFromBuffer(fileBuffer, filename);
      return `http://localhost:5005/files/${fileId}`;
    } catch (error) {
      console.error('Error saving file:', error);
      throw new Error('File saving failed');
    }
  }

  async getFileById(id: string): Promise<Readable> {
    try {
      const fileStream = this.bucket.openDownloadStream(
        new mongoose.mongo.BSON.ObjectId(id),
      );
      return fileStream;
    } catch (error) {
      console.error('Error retrieving file:', error);
      throw new Error('File retrieval failed');
    }
  }
}
