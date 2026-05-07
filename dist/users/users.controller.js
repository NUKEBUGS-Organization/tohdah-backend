"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const users_service_1 = require("./users.service");
const update_profile_dto_1 = require("./dto/update-profile.dto");
const change_password_dto_1 = require("./dto/change-password.dto");
const change_email_dto_1 = require("./dto/change-email.dto");
const change_phone_dto_1 = require("./dto/change-phone.dto");
const report_user_dto_1 = require("./dto/report-user.dto");
const register_fcm_token_dto_1 = require("./dto/register-fcm-token.dto");
const redis_service_1 = require("../common/redis/redis.service");
let UsersController = class UsersController {
    usersService;
    redisService;
    constructor(usersService, redisService) {
        this.usersService = usersService;
        this.redisService = redisService;
    }
    updateProfile(user, dto) {
        return this.usersService.updateProfile(user.userId, dto);
    }
    changePassword(user, dto) {
        return this.usersService.changePassword(user.userId, dto);
    }
    changeEmail(user, dto) {
        return this.usersService.changeEmail(user.userId, dto);
    }
    changePhone(user, dto) {
        return this.usersService.changePhone(user.userId, dto);
    }
    listBlocked(user) {
        return this.usersService.listBlocked(user.userId);
    }
    report(user, dto) {
        return this.usersService.reportUser(user.userId, dto);
    }
    block(user, targetUserId) {
        return this.usersService
            .blockUser(user.userId, targetUserId)
            .then(() => ({ message: 'User blocked' }));
    }
    unblock(user, targetUserId) {
        return this.usersService
            .unblockUser(user.userId, targetUserId)
            .then(() => ({ message: 'User unblocked' }));
    }
    registerFcmToken(user, body) {
        return this.usersService
            .addFcmToken(user.userId, body.token)
            .then(() => ({ message: 'FCM token registered' }));
    }
    removeFcmToken(user, body) {
        return this.usersService
            .removeFcmToken(user.userId, body.token)
            .then(() => ({ message: 'FCM token removed' }));
    }
    getActiveSessions(user) {
        return this.redisService
            .countSessions(user.userId)
            .then((count) => ({ activeSessions: count }));
    }
    revokeAllSessions(user) {
        return this.redisService
            .deleteAllRefreshTokens(user.userId)
            .then(() => ({
            message: 'All sessions revoked. Please log in again.',
        }));
    }
    getProfile(userId) {
        return this.usersService.getPublicProfile(userId);
    }
    getStats(userId) {
        return this.usersService.getStats(userId);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Patch)('profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_profile_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Patch)('change-password'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_password_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Patch)('change-email'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_email_dto_1.ChangeEmailDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "changeEmail", null);
__decorate([
    (0, common_1.Patch)('change-phone'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_phone_dto_1.ChangePhoneDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "changePhone", null);
__decorate([
    (0, common_1.Get)('blocked'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "listBlocked", null);
__decorate([
    (0, common_1.Post)('report'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, report_user_dto_1.ReportUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "report", null);
__decorate([
    (0, common_1.Post)('block/:targetUserId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('targetUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "block", null);
__decorate([
    (0, common_1.Delete)('block/:targetUserId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('targetUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "unblock", null);
__decorate([
    (0, common_1.Post)('fcm-token'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, register_fcm_token_dto_1.RegisterFcmTokenDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "registerFcmToken", null);
__decorate([
    (0, common_1.Delete)('fcm-token'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, register_fcm_token_dto_1.RegisterFcmTokenDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "removeFcmToken", null);
__decorate([
    (0, common_1.Get)('sessions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getActiveSessions", null);
__decorate([
    (0, common_1.Delete)('sessions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "revokeAllSessions", null);
__decorate([
    (0, common_1.Get)(':userId/profile'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)(':userId/stats'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getStats", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        redis_service_1.RedisService])
], UsersController);
//# sourceMappingURL=users.controller.js.map