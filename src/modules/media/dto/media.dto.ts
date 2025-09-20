export class MediaResponseDto {
  id: number;
  url: string;
  mimeType: string;
  size?: number;
  uploadedById?: number;
  createdAt: Date;
}

export class CreateMediaDto {
  file: Express.Multer.File;
  uploadedById?: number;
}

