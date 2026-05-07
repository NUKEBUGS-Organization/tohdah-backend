import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs/promises';
import * as path from 'path';

const SUBDIRS = ['avatars', 'delivery', 'items', 'chat'] as const;
export type UploadSubdir = (typeof SUBDIRS)[number];

/** Shared with `main.ts` static assets and Multer `destination`. */
export function resolveUploadRootFromEnv(): string {
  const dest = process.env.UPLOAD_DEST?.trim() || './uploads';
  return path.isAbsolute(dest)
    ? dest
    : path.join(process.cwd(), dest.replace(/^\.\//, ''));
}

export function resolveMaxUploadBytesFromEnv(): number {
  const mb = Number(process.env.MAX_FILE_SIZE_MB ?? 5);
  return (Number.isFinite(mb) && mb > 0 ? mb : 5) * 1024 * 1024;
}

export function resolveUseCloudStorageFromEnv(): boolean {
  return process.env.USE_CLOUD_STORAGE === 'true';
}

@Injectable()
export class UploadService implements OnModuleInit {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadRoot: string;
  private readonly baseUrl: string;
  private readonly maxBytes: number;
  private readonly allowedMimeTypes: Set<string>;
  private readonly useCloud: boolean;

  constructor(private readonly config: ConfigService) {
    this.uploadRoot = resolveUploadRootFromEnv();
    this.baseUrl = (
      this.config.get<string>('BASE_URL')?.trim() || 'http://localhost:3000'
    ).replace(/\/$/, '');
    const mb = Number(
      this.config.get<string>('MAX_FILE_SIZE_MB') ??
        process.env.MAX_FILE_SIZE_MB ??
        5,
    );
    this.maxBytes =
      (Number.isFinite(mb) && mb > 0 ? mb : 5) * 1024 * 1024;
    const types =
      this.config.get<string>('ALLOWED_FILE_TYPES') ??
      'image/jpeg,image/png,image/webp';
    this.allowedMimeTypes = new Set(
      types.split(',').map((t) => t.trim().toLowerCase()),
    );
    this.useCloud =
      this.config.get<string>('USE_CLOUD_STORAGE') === 'true' ||
      resolveUseCloudStorageFromEnv();
    if (this.useCloud) {
      cloudinary.config({
        cloud_name: this.config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
        api_key: this.config.getOrThrow<string>('CLOUDINARY_API_KEY'),
        api_secret: this.config.getOrThrow<string>('CLOUDINARY_API_SECRET'),
      });
    }
  }

  onModuleInit(): void {
    void this.ensureDirectories();
  }

  isCloudStorageEnabled(): boolean {
    return this.useCloud;
  }

  /** Absolute path to upload root (e.g. …/project/uploads). */
  getUploadRoot(): string {
    return this.uploadRoot;
  }

  getAbsoluteSubdir(subdir: UploadSubdir): string {
    return path.join(this.uploadRoot, subdir);
  }

  async ensureDirectories(): Promise<void> {
    if (this.useCloud) return;
    await fs.mkdir(this.uploadRoot, { recursive: true });
    for (const d of SUBDIRS) {
      await fs.mkdir(path.join(this.uploadRoot, d), { recursive: true });
    }
  }

  /**
   * Public URL for a stored file (static route `/uploads/...`).
   * Example: http://localhost:3000/uploads/avatars/abc.jpg
   */
  getFilePath(subdir: string, filename: string): string {
    return `${this.baseUrl}/uploads/${subdir}/${filename}`;
  }

  async uploadToCloud(
    file: Express.Multer.File,
    folder: UploadSubdir,
  ): Promise<string> {
    if (!this.useCloud) {
      const name =
        file.filename ??
        (file.path ? path.basename(file.path) : `upload-${Date.now()}`);
      return this.getFilePath(folder, name);
    }
    const buf = file.buffer;
    if (!buf?.length) {
      throw new BadRequestException('Missing file buffer for cloud upload');
    }
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `tohdah/${folder}`,
          resource_type: 'image',
          transformation: [
            { quality: 'auto', fetch_format: 'auto' },
            { width: 1200, crop: 'limit' },
          ],
        },
        (error, result) => {
          if (error || !result?.secure_url) {
            return reject(error ?? new Error('Cloudinary upload failed'));
          }
          resolve(result.secure_url);
        },
      );
      stream.end(buf);
    });
  }

  async deleteFromCloud(url: string): Promise<void> {
    if (!url.includes('cloudinary.com')) return;
    const publicId = this.publicIdFromCloudinaryUrl(url);
    if (!publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to delete from Cloudinary: ${msg}`);
    }
  }

  /** Deletes a file given a public URL (local `/uploads/` or Cloudinary). */
  async deleteFile(publicUrl: string): Promise<void> {
    if (publicUrl.includes('cloudinary.com')) {
      await this.deleteFromCloud(publicUrl);
      return;
    }
    const rel = this.publicUrlToRelativePath(publicUrl);
    if (!rel) return;
    const abs = path.join(this.uploadRoot, rel);
    if (!abs.startsWith(this.uploadRoot)) return;
    try {
      await fs.unlink(abs);
    } catch {
      // ignore missing file
    }
  }

  private publicIdFromCloudinaryUrl(url: string): string | null {
    const marker = '/upload/';
    const i = url.indexOf(marker);
    if (i === -1) return null;
    let rest = url.slice(i + marker.length);
    rest = rest.replace(/^v\d+\//, '');
    const withoutQuery = rest.split('?')[0] ?? rest;
    return withoutQuery.replace(/\.[^/.]+$/, '') || null;
  }

  /** If URL is hosted by us (BASE_URL + /uploads/...), return path relative to upload root. */
  private publicUrlToRelativePath(publicUrl: string): string | null {
    if (!publicUrl.startsWith(this.baseUrl)) return null;
    const rest = publicUrl.slice(this.baseUrl.length);
    if (!rest.startsWith('/uploads/')) return null;
    return decodeURIComponent(rest.slice('/uploads/'.length));
  }

  validateFile(file: Express.Multer.File): void {
    if (!file?.mimetype) {
      throw new BadRequestException('No file uploaded');
    }
    const mime = file.mimetype.toLowerCase();
    if (!this.allowedMimeTypes.has(mime)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${[...this.allowedMimeTypes].join(', ')}`,
      );
    }
    if (file.size > this.maxBytes) {
      throw new BadRequestException(
        `File too large (max ${Math.round(this.maxBytes / 1024 / 1024)}MB)`,
      );
    }
  }

  getMaxFileSizeBytes(): number {
    return this.maxBytes;
  }

  extensionFromMime(mimetype: string): string {
    const m = mimetype.toLowerCase();
    if (m === 'image/jpeg') return 'jpg';
    if (m === 'image/png') return 'png';
    if (m === 'image/webp') return 'webp';
    return 'bin';
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}
