import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { MediaResponseDto } from './dto/media.dto';
import { join } from 'path';
import { writeFileSync, existsSync, mkdirSync } from 'fs';

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async uploadFile(
    userId: number,
    file: Express.Multer.File,
  ): Promise<MediaResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${file.originalname}`;

    const uploadsDir = join(__dirname, '..', '..', '..', 'uploads');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    const uploadPath = join(uploadsDir, uniqueFilename);
    writeFileSync(uploadPath, file.buffer);

    const mediaRecord = await this.prisma.media.create({
      data: {
        url: `/uploads/${uniqueFilename}`,
        mimeType: file.mimetype,
        size: file.size,
        uploadedById: userId,
      },
    });

    return {
      id: mediaRecord.id,
      url: mediaRecord.url,
      mimeType: mediaRecord.mimeType,
      size: mediaRecord.size || undefined,
      uploadedById: mediaRecord.uploadedById || undefined,
      createdAt: mediaRecord.createdAt,
    };
  }

  async create(
    file: Express.Multer.File,
    uploadedById?: number,
  ): Promise<MediaResponseDto> {
    if (!file.buffer) {
      throw new BadRequestException('No file buffer found');
    }

    const timestamp = Date.now();
    const fileExtension = file.originalname.split('.').pop();
    const uniqueFilename = `${timestamp}-${file.originalname}`;

    const uploadsDir = join(__dirname, '..', '..', '..', 'uploads');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    const uploadPath = join(uploadsDir, uniqueFilename);
    writeFileSync(uploadPath, file.buffer);

    const mediaRecord = await this.prisma.media.create({
      data: {
        url: `/uploads/${uniqueFilename}`,
        mimeType: file.mimetype,
        size: file.size,
        uploadedById: uploadedById || null,
      },
    });

    return {
      id: mediaRecord.id,
      url: mediaRecord.url,
      mimeType: mediaRecord.mimeType,
      size: mediaRecord.size || undefined,
      uploadedById: mediaRecord.uploadedById || undefined,
      createdAt: mediaRecord.createdAt,
    };
  }

  async getUserFiles(userId: number): Promise<MediaResponseDto[]> {
    const userFiles = await this.prisma.media.findMany({
      where: {
        uploadedById: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return userFiles.map((file) => ({
      id: file.id,
      url: file.url,
      mimeType: file.mimeType,
      size: file.size || undefined,
      uploadedById: file.uploadedById || undefined,
      createdAt: file.createdAt,
    }));
  }

  async deleteFile(
    fileId: number,
    userId: number,
  ): Promise<{ message: string }> {
    const file = await this.prisma.media.findFirst({
      where: {
        id: fileId,
        uploadedById: userId,
      },
    });

    if (!file) {
      throw new BadRequestException(
        'File not found or you do not have permission to delete it',
      );
    }

    await this.prisma.media.delete({
      where: { id: fileId },
    });

    return { message: 'File deleted successfully' };
  }
}
