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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const throttle_decorator_1 = require("../common/decorators/throttle.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const upload_service_1 = require("./upload.service");
const users_service_1 = require("../users/users.service");
const bookings_service_1 = require("../bookings/bookings.service");
function imageDiskStorage(subdir, filename) {
    return (0, multer_1.diskStorage)({
        destination: (_req, _file, cb) => {
            cb(null, path.join((0, upload_service_1.resolveUploadRootFromEnv)(), subdir));
        },
        filename: (req, file, cb) => {
            try {
                cb(null, filename(req, file));
            }
            catch (err) {
                cb(err, '');
            }
        },
    });
}
function multerImageOptions(subdir, filename) {
    const useCloud = (0, upload_service_1.resolveUseCloudStorageFromEnv)();
    return {
        limits: { fileSize: (0, upload_service_1.resolveMaxUploadBytesFromEnv)() },
        storage: useCloud ? (0, multer_1.memoryStorage)() : imageDiskStorage(subdir, filename),
    };
}
let UploadController = class UploadController {
    uploadService;
    usersService;
    bookingsService;
    constructor(uploadService, usersService, bookingsService) {
        this.uploadService = uploadService;
        this.usersService = usersService;
        this.bookingsService = bookingsService;
    }
    async uploadAvatar(user, file) {
        try {
            this.uploadService.validateFile(file);
        }
        catch (err) {
            if (file?.path)
                await fs.unlink(file.path).catch(() => { });
            throw err;
        }
        const url = await this.uploadService.uploadToCloud(file, 'avatars');
        const existing = await this.usersService.findById(user.userId);
        const prev = existing?.profilePhoto;
        if (prev &&
            (prev.startsWith(this.uploadService.getBaseUrl()) ||
                prev.includes('cloudinary.com'))) {
            await this.uploadService.deleteFile(prev);
        }
        await this.usersService.updateProfile(user.userId, { profilePhoto: url });
        return { url };
    }
    async uploadDelivery(user, bookingId, file) {
        await this.bookingsService.findOneForParty(bookingId, user.userId);
        try {
            this.uploadService.validateFile(file);
        }
        catch (err) {
            if (file?.path)
                await fs.unlink(file.path).catch(() => { });
            throw err;
        }
        const url = await this.uploadService.uploadToCloud(file, 'delivery');
        return { url };
    }
    async uploadItem(_user, file) {
        try {
            this.uploadService.validateFile(file);
        }
        catch (err) {
            if (file?.path)
                await fs.unlink(file.path).catch(() => { });
            throw err;
        }
        const url = await this.uploadService.uploadToCloud(file, 'items');
        return { url };
    }
    async uploadChat(user, bookingId, file) {
        await this.bookingsService.findOneForParty(bookingId, user.userId);
        try {
            this.uploadService.validateFile(file);
        }
        catch (err) {
            if (file?.path)
                await fs.unlink(file.path).catch(() => { });
            throw err;
        }
        const url = await this.uploadService.uploadToCloud(file, 'chat');
        return { url };
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Post)('avatar'),
    (0, throttle_decorator_1.UploadThrottle)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', multerImageOptions('avatars', (req, file) => {
        const u = req.user;
        const ext = file.mimetype === 'image/png'
            ? 'png'
            : file.mimetype === 'image/webp'
                ? 'webp'
                : 'jpg';
        return `${u?.userId}-${Date.now()}.${ext}`;
    }))),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Post)('delivery/:bookingId'),
    (0, throttle_decorator_1.UploadThrottle)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', multerImageOptions('delivery', (req, file) => {
        const bid = req.params.bookingId;
        const ext = file.mimetype === 'image/png'
            ? 'png'
            : file.mimetype === 'image/webp'
                ? 'webp'
                : 'jpg';
        return `${bid}-${Date.now()}.${ext}`;
    }))),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('bookingId')),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadDelivery", null);
__decorate([
    (0, common_1.Post)('item'),
    (0, throttle_decorator_1.UploadThrottle)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', multerImageOptions('items', (req, file) => {
        const u = req.user;
        const ext = file.mimetype === 'image/png'
            ? 'png'
            : file.mimetype === 'image/webp'
                ? 'webp'
                : 'jpg';
        return `${u?.userId}-item-${Date.now()}.${ext}`;
    }))),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadItem", null);
__decorate([
    (0, common_1.Post)('chat/:bookingId'),
    (0, throttle_decorator_1.UploadThrottle)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', multerImageOptions('chat', (req, file) => {
        const bid = req.params.bookingId;
        const ext = file.mimetype === 'image/png'
            ? 'png'
            : file.mimetype === 'image/webp'
                ? 'webp'
                : 'jpg';
        return `${bid}-chat-${Date.now()}.${ext}`;
    }))),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('bookingId')),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadChat", null);
exports.UploadController = UploadController = __decorate([
    (0, common_1.Controller)('upload'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [upload_service_1.UploadService,
        users_service_1.UsersService,
        bookings_service_1.BookingsService])
], UploadController);
//# sourceMappingURL=upload.controller.js.map