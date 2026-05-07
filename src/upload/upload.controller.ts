import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs/promises';
import type { Request } from 'express';
import { UploadThrottle } from '../common/decorators/throttle.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/strategies/jwt-access.strategy';
import {
  UploadService,
  resolveMaxUploadBytesFromEnv,
  resolveUploadRootFromEnv,
  resolveUseCloudStorageFromEnv,
  type UploadSubdir,
} from './upload.service';
import { UsersService } from '../users/users.service';
import { BookingsService } from '../bookings/bookings.service';

function imageDiskStorage(
  subdir: UploadSubdir,
  filename: (req: Request, file: Express.Multer.File) => string,
) {
  return diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.join(resolveUploadRootFromEnv(), subdir));
    },
    filename: (req, file, cb) => {
      try {
        cb(null, filename(req, file));
      } catch (err) {
        cb(err as Error, '');
      }
    },
  });
}

function multerImageOptions(subdir: UploadSubdir, filename: (req: Request, file: Express.Multer.File) => string) {
  const useCloud = resolveUseCloudStorageFromEnv();
  return {
    limits: { fileSize: resolveMaxUploadBytesFromEnv() },
    storage: useCloud ? memoryStorage() : imageDiskStorage(subdir, filename),
  };
}

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly usersService: UsersService,
    private readonly bookingsService: BookingsService,
  ) {}

  @Post('avatar')
  @UploadThrottle()
  @UseInterceptors(
    FileInterceptor(
      'file',
      multerImageOptions('avatars', (req, file) => {
        const u = (req as Request & { user?: RequestUser }).user;
        const ext =
          file.mimetype === 'image/png'
            ? 'png'
            : file.mimetype === 'image/webp'
              ? 'webp'
              : 'jpg';
        return `${u?.userId}-${Date.now()}.${ext}`;
      }),
    ),
  )
  async uploadAvatar(
    @CurrentUser() user: RequestUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      this.uploadService.validateFile(file);
    } catch (err) {
      if (file?.path) await fs.unlink(file.path).catch(() => {});
      throw err;
    }
    const url = await this.uploadService.uploadToCloud(file, 'avatars');

    const existing = await this.usersService.findById(user.userId);
    const prev = existing?.profilePhoto;
    if (
      prev &&
      (prev.startsWith(this.uploadService.getBaseUrl()) ||
        prev.includes('cloudinary.com'))
    ) {
      await this.uploadService.deleteFile(prev);
    }

    await this.usersService.updateProfile(user.userId, { profilePhoto: url });
    return { url };
  }

  @Post('delivery/:bookingId')
  @UploadThrottle()
  @UseInterceptors(
    FileInterceptor(
      'file',
      multerImageOptions('delivery', (req, file) => {
        const bid = (req.params as { bookingId: string }).bookingId;
        const ext =
          file.mimetype === 'image/png'
            ? 'png'
            : file.mimetype === 'image/webp'
              ? 'webp'
              : 'jpg';
        return `${bid}-${Date.now()}.${ext}`;
      }),
    ),
  )
  async uploadDelivery(
    @CurrentUser() user: RequestUser,
    @Param('bookingId') bookingId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    await this.bookingsService.findOneForParty(bookingId, user.userId);
    try {
      this.uploadService.validateFile(file);
    } catch (err) {
      if (file?.path) await fs.unlink(file.path).catch(() => {});
      throw err;
    }
    const url = await this.uploadService.uploadToCloud(file, 'delivery');
    return { url };
  }

  @Post('item')
  @UploadThrottle()
  @UseInterceptors(
    FileInterceptor(
      'file',
      multerImageOptions('items', (req, file) => {
        const u = (req as Request & { user?: RequestUser }).user;
        const ext =
          file.mimetype === 'image/png'
            ? 'png'
            : file.mimetype === 'image/webp'
              ? 'webp'
              : 'jpg';
        return `${u?.userId}-item-${Date.now()}.${ext}`;
      }),
    ),
  )
  async uploadItem(
    @CurrentUser() _user: RequestUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      this.uploadService.validateFile(file);
    } catch (err) {
      if (file?.path) await fs.unlink(file.path).catch(() => {});
      throw err;
    }
    const url = await this.uploadService.uploadToCloud(file, 'items');
    return { url };
  }

  @Post('chat/:bookingId')
  @UploadThrottle()
  @UseInterceptors(
    FileInterceptor(
      'file',
      multerImageOptions('chat', (req, file) => {
        const bid = (req.params as { bookingId: string }).bookingId;
        const ext =
          file.mimetype === 'image/png'
            ? 'png'
            : file.mimetype === 'image/webp'
              ? 'webp'
              : 'jpg';
        return `${bid}-chat-${Date.now()}.${ext}`;
      }),
    ),
  )
  async uploadChat(
    @CurrentUser() user: RequestUser,
    @Param('bookingId') bookingId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    await this.bookingsService.findOneForParty(bookingId, user.userId);
    try {
      this.uploadService.validateFile(file);
    } catch (err) {
      if (file?.path) await fs.unlink(file.path).catch(() => {});
      throw err;
    }
    const url = await this.uploadService.uploadToCloud(file, 'chat');
    return { url };
  }
}
