import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUserId } from '../../shared/decorators/current-user-id.decorator';
import { ApiResponseDto } from '../../shared/dto/api-response.dto';

@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @CurrentUserId() userId: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponseDto> {
    const result = await this.mediaService.uploadFile(userId, file);
    return ApiResponseDto.success('File uploaded successfully', result);
  }

  @Get('my-files')
  async getUserFiles(@CurrentUserId() userId: number): Promise<ApiResponseDto> {
    const files = await this.mediaService.getUserFiles(userId);
    return ApiResponseDto.success('User files retrieved successfully', files);
  }

  @Delete(':id')
  async deleteFile(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) fileId: number,
  ): Promise<ApiResponseDto> {
    const result = await this.mediaService.deleteFile(fileId, userId);
    return ApiResponseDto.success(result.message);
  }
}
