"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UploadService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
exports.resolveUploadRootFromEnv = resolveUploadRootFromEnv;
exports.resolveMaxUploadBytesFromEnv = resolveMaxUploadBytesFromEnv;
exports.resolveUseCloudStorageFromEnv = resolveUseCloudStorageFromEnv;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cloudinary_1 = require("cloudinary");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const SUBDIRS = ['avatars', 'delivery', 'items', 'chat'];
function resolveUploadRootFromEnv() {
    const dest = process.env.UPLOAD_DEST?.trim() || './uploads';
    return path.isAbsolute(dest)
        ? dest
        : path.join(process.cwd(), dest.replace(/^\.\//, ''));
}
function resolveMaxUploadBytesFromEnv() {
    const mb = Number(process.env.MAX_FILE_SIZE_MB ?? 5);
    return (Number.isFinite(mb) && mb > 0 ? mb : 5) * 1024 * 1024;
}
function resolveUseCloudStorageFromEnv() {
    return process.env.USE_CLOUD_STORAGE === 'true';
}
let UploadService = UploadService_1 = class UploadService {
    config;
    logger = new common_1.Logger(UploadService_1.name);
    uploadRoot;
    baseUrl;
    maxBytes;
    allowedMimeTypes;
    useCloud;
    constructor(config) {
        this.config = config;
        this.uploadRoot = resolveUploadRootFromEnv();
        this.baseUrl = (this.config.get('BASE_URL')?.trim() || 'http://localhost:3000').replace(/\/$/, '');
        const mb = Number(this.config.get('MAX_FILE_SIZE_MB') ??
            process.env.MAX_FILE_SIZE_MB ??
            5);
        this.maxBytes =
            (Number.isFinite(mb) && mb > 0 ? mb : 5) * 1024 * 1024;
        const types = this.config.get('ALLOWED_FILE_TYPES') ??
            'image/jpeg,image/png,image/webp';
        this.allowedMimeTypes = new Set(types.split(',').map((t) => t.trim().toLowerCase()));
        this.useCloud =
            this.config.get('USE_CLOUD_STORAGE') === 'true' ||
                resolveUseCloudStorageFromEnv();
        if (this.useCloud) {
            cloudinary_1.v2.config({
                cloud_name: this.config.getOrThrow('CLOUDINARY_CLOUD_NAME'),
                api_key: this.config.getOrThrow('CLOUDINARY_API_KEY'),
                api_secret: this.config.getOrThrow('CLOUDINARY_API_SECRET'),
            });
        }
    }
    onModuleInit() {
        void this.ensureDirectories();
    }
    isCloudStorageEnabled() {
        return this.useCloud;
    }
    getUploadRoot() {
        return this.uploadRoot;
    }
    getAbsoluteSubdir(subdir) {
        return path.join(this.uploadRoot, subdir);
    }
    async ensureDirectories() {
        if (this.useCloud)
            return;
        await fs.mkdir(this.uploadRoot, { recursive: true });
        for (const d of SUBDIRS) {
            await fs.mkdir(path.join(this.uploadRoot, d), { recursive: true });
        }
    }
    getFilePath(subdir, filename) {
        return `${this.baseUrl}/uploads/${subdir}/${filename}`;
    }
    async uploadToCloud(file, folder) {
        if (!this.useCloud) {
            const name = file.filename ??
                (file.path ? path.basename(file.path) : `upload-${Date.now()}`);
            return this.getFilePath(folder, name);
        }
        const buf = file.buffer;
        if (!buf?.length) {
            throw new common_1.BadRequestException('Missing file buffer for cloud upload');
        }
        return new Promise((resolve, reject) => {
            const stream = cloudinary_1.v2.uploader.upload_stream({
                folder: `tohdah/${folder}`,
                resource_type: 'image',
                transformation: [
                    { quality: 'auto', fetch_format: 'auto' },
                    { width: 1200, crop: 'limit' },
                ],
            }, (error, result) => {
                if (error || !result?.secure_url) {
                    return reject(error ?? new Error('Cloudinary upload failed'));
                }
                resolve(result.secure_url);
            });
            stream.end(buf);
        });
    }
    async deleteFromCloud(url) {
        if (!url.includes('cloudinary.com'))
            return;
        const publicId = this.publicIdFromCloudinaryUrl(url);
        if (!publicId)
            return;
        try {
            await cloudinary_1.v2.uploader.destroy(publicId);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.warn(`Failed to delete from Cloudinary: ${msg}`);
        }
    }
    async deleteFile(publicUrl) {
        if (publicUrl.includes('cloudinary.com')) {
            await this.deleteFromCloud(publicUrl);
            return;
        }
        const rel = this.publicUrlToRelativePath(publicUrl);
        if (!rel)
            return;
        const abs = path.join(this.uploadRoot, rel);
        if (!abs.startsWith(this.uploadRoot))
            return;
        try {
            await fs.unlink(abs);
        }
        catch {
        }
    }
    publicIdFromCloudinaryUrl(url) {
        const marker = '/upload/';
        const i = url.indexOf(marker);
        if (i === -1)
            return null;
        let rest = url.slice(i + marker.length);
        rest = rest.replace(/^v\d+\//, '');
        const withoutQuery = rest.split('?')[0] ?? rest;
        return withoutQuery.replace(/\.[^/.]+$/, '') || null;
    }
    publicUrlToRelativePath(publicUrl) {
        if (!publicUrl.startsWith(this.baseUrl))
            return null;
        const rest = publicUrl.slice(this.baseUrl.length);
        if (!rest.startsWith('/uploads/'))
            return null;
        return decodeURIComponent(rest.slice('/uploads/'.length));
    }
    validateFile(file) {
        if (!file?.mimetype) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        const mime = file.mimetype.toLowerCase();
        if (!this.allowedMimeTypes.has(mime)) {
            throw new common_1.BadRequestException(`Invalid file type. Allowed: ${[...this.allowedMimeTypes].join(', ')}`);
        }
        if (file.size > this.maxBytes) {
            throw new common_1.BadRequestException(`File too large (max ${Math.round(this.maxBytes / 1024 / 1024)}MB)`);
        }
    }
    getMaxFileSizeBytes() {
        return this.maxBytes;
    }
    extensionFromMime(mimetype) {
        const m = mimetype.toLowerCase();
        if (m === 'image/jpeg')
            return 'jpg';
        if (m === 'image/png')
            return 'png';
        if (m === 'image/webp')
            return 'webp';
        return 'bin';
    }
    getBaseUrl() {
        return this.baseUrl;
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = UploadService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], UploadService);
//# sourceMappingURL=upload.service.js.map