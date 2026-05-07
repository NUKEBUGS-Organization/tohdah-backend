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
exports.TrustController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const trust_service_1 = require("./trust.service");
const verify_field_dto_1 = require("./dto/verify-field.dto");
let TrustController = class TrustController {
    trustService;
    constructor(trustService) {
        this.trustService = trustService;
    }
    getMine(user) {
        return this.trustService.getTrustResult(user.userId);
    }
    getUser(userId) {
        return this.trustService.getTrustResult(userId);
    }
    badges(userId) {
        return this.trustService.getBadges(userId);
    }
    verifyStub(user, dto) {
        return this.trustService.verifyFieldStub(user.userId, dto.field);
    }
};
exports.TrustController = TrustController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "getMine", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "getUser", null);
__decorate([
    (0, common_1.Get)('badges/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "badges", null);
__decorate([
    (0, common_1.Patch)('verify'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, verify_field_dto_1.VerifyFieldDto]),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "verifyStub", null);
exports.TrustController = TrustController = __decorate([
    (0, common_1.Controller)('trust'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [trust_service_1.TrustService])
], TrustController);
//# sourceMappingURL=trust.controller.js.map