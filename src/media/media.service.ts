import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { join } from 'path';
import { writeFileSync, existsSync, mkdirSync } from 'fs';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  async create(file: Express.Multer.File, uploadedById?: number) {
    try {
      console.log('💾 Processing file upload:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        uploadedById: uploadedById,
      });

      // Validate file
      if (!file.buffer) {
        throw new BadRequestException('No file buffer found');
      }

      // Generate unique filename to avoid conflicts using timestamp
      const timestamp = Date.now();
      const fileExtension = file.originalname.split('.').pop();
      const uniqueFilename = `${timestamp}-${file.originalname}`;

      // Ensure uploads directory exists
      const uploadsDir = join(__dirname, '..', '..', 'uploads');
      if (!existsSync(uploadsDir)) {
        mkdirSync(uploadsDir, { recursive: true });
        console.log('📁 Created uploads directory');
      }

      // Save file locally
      const uploadPath = join(uploadsDir, uniqueFilename);
      writeFileSync(uploadPath, file.buffer);

      console.log('💾 File saved to:', uploadPath);

      // Save record to DB media table with uploadedById
      const mediaRecord = await this.prisma.media.create({
        data: {
          url: `/uploads/${uniqueFilename}`,
          mimeType: file.mimetype,
          size: file.size, // Add file size
          uploadedById: uploadedById || null, // Store the user ID
        },
      });

      console.log('✅ Media record created:', mediaRecord);
      return mediaRecord;
    } catch (error) {
      console.error('❌ Error in media service create:', error);
      throw error;
    }
  }

  // Add method to get user's uploaded files
  async getUserFiles(userId: number) {
    try {
      const userFiles = await this.prisma.media.findMany({
        where: {
          uploadedById: userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      console.log(`📁 Found ${userFiles.length} files for userId: ${userId}`);
      return userFiles;
    } catch (error) {
      console.error('❌ Error getting user files:', error);
      throw error;
    }
  }

  // Add method to delete a file
  async deleteFile(fileId: number, userId: number) {
    try {
      // First check if the file belongs to the user
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

      // Delete file from database
      await this.prisma.media.delete({
        where: { id: fileId },
      });

      // Optionally delete physical file (uncomment if needed)
      // const filePath = join(__dirname, '..', '..', 'uploads', file.url.replace('/uploads/', ''));
      // if (existsSync(filePath)) {
      //   unlinkSync(filePath);
      //   console.log('🗑️ Physical file deleted:', filePath);
      // }

      console.log('✅ File deleted successfully:', fileId);
      return { message: 'File deleted successfully' };
    } catch (error) {
      console.error('❌ Error deleting file:', error);
      throw error;
    }
  }
}
