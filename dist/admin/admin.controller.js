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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const throttle_decorator_1 = require("../common/decorators/throttle.decorator");
const admin_guard_1 = require("../auth/guards/admin.guard");
const superadmin_guard_1 = require("../auth/guards/superadmin.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const admin_service_1 = require("./admin.service");
const suspend_ban_dto_1 = require("./dto/suspend-ban.dto");
const update_user_role_dto_1 = require("./dto/update-user-role.dto");
const resolve_dispute_dto_1 = require("./dto/resolve-dispute.dto");
const support_notes_dto_1 = require("./dto/support-notes.dto");
function optInt(v) {
    if (v === undefined || v === '')
        return undefined;
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? undefined : n;
}
function optBool(v) {
    if (v === 'true')
        return true;
    if (v === 'false')
        return false;
    return undefined;
}
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    getStats() {
        return this.adminService.getPlatformStats();
    }
    listUsers(q) {
        return this.adminService.listUsers({
            search: q.search,
            role: q.role,
            accountType: q.accountType,
            status: q.status,
            isVerified: optBool(q.isVerified),
            dateFrom: q.dateFrom,
            dateTo: q.dateTo,
            page: optInt(q.page),
            limit: optInt(q.limit),
        });
    }
    listTrips(q) {
        return this.adminService.listTrips({
            status: q.status,
            origin: q.origin,
            destination: q.destination,
            dateFrom: q.dateFrom,
            dateTo: q.dateTo,
            travelerId: q.travelerId,
            page: optInt(q.page),
            limit: optInt(q.limit),
        });
    }
    listRequests(q) {
        return this.adminService.listRequests({
            status: q.status,
            type: q.type,
            urgencyLevel: q.urgencyLevel,
            origin: q.origin,
            destination: q.destination,
            requesterId: q.requesterId,
            page: optInt(q.page),
            limit: optInt(q.limit),
        });
    }
    listBookings(q) {
        return this.adminService.listBookings({
            status: q.status,
            travelerId: q.travelerId,
            requesterId: q.requesterId,
            dateFrom: q.dateFrom,
            dateTo: q.dateTo,
            page: optInt(q.page),
            limit: optInt(q.limit),
        });
    }
    listDisputes(q) {
        return this.adminService.listDisputes({
            dateFrom: q.dateFrom,
            dateTo: q.dateTo,
            page: optInt(q.page),
            limit: optInt(q.limit),
        });
    }
    resolveDispute(admin, bookingId, dto) {
        return this.adminService.resolveDispute(admin.userId, bookingId, dto);
    }
    listSupportRequests(q) {
        return this.adminService.listSupportRequests({
            adminApprovalStatus: q.adminApprovalStatus,
            urgencyLevel: q.urgencyLevel,
            status: q.status,
            page: optInt(q.page),
            limit: optInt(q.limit),
        });
    }
    approveSupport(admin, requestId, dto) {
        return this.adminService.approveSupportRequest(admin.userId, requestId, dto.notes);
    }
    rejectSupport(admin, requestId, dto) {
        return this.adminService.rejectSupportRequest(admin.userId, requestId, dto.notes);
    }
    getImpact(q) {
        return this.adminService.getImpact({
            dateFrom: q.dateFrom,
            dateTo: q.dateTo,
        });
    }
    listReferrals(q) {
        return this.adminService.listReferrals({
            page: optInt(q.page),
            limit: optInt(q.limit),
        });
    }
    loyalty() {
        return this.adminService.getLoyaltyOverview();
    }
    suspend(_admin, userId, dto) {
        return this.adminService.suspendUser(_admin.userId, userId, dto.reason);
    }
    ban(_admin, userId, dto) {
        return this.adminService.banUser(_admin.userId, userId, dto.reason);
    }
    reinstate(admin, userId) {
        return this.adminService.reinstateUser(admin.userId, userId);
    }
    updateRole(admin, userId, dto) {
        return this.adminService.updateUserRole(admin.userId, userId, dto.role);
    }
    getUser(userId) {
        return this.adminService.getUserDetail(userId);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Get)('trips'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listTrips", null);
__decorate([
    (0, common_1.Get)('requests'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listRequests", null);
__decorate([
    (0, common_1.Get)('bookings'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listBookings", null);
__decorate([
    (0, common_1.Get)('disputes'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listDisputes", null);
__decorate([
    (0, common_1.Post)('disputes/:bookingId/resolve'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('bookingId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, resolve_dispute_dto_1.ResolveDisputeDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "resolveDispute", null);
__decorate([
    (0, common_1.Get)('support-requests'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listSupportRequests", null);
__decorate([
    (0, common_1.Post)('support-requests/:requestId/approve'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('requestId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, support_notes_dto_1.ApproveSupportDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "approveSupport", null);
__decorate([
    (0, common_1.Post)('support-requests/:requestId/reject'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('requestId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, support_notes_dto_1.RejectSupportDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "rejectSupport", null);
__decorate([
    (0, common_1.Get)('impact'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getImpact", null);
__decorate([
    (0, common_1.Get)('referrals'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listReferrals", null);
__decorate([
    (0, common_1.Get)('loyalty'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "loyalty", null);
__decorate([
    (0, common_1.Patch)('users/:userId/suspend'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, suspend_ban_dto_1.SuspendUserDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "suspend", null);
__decorate([
    (0, common_1.Patch)('users/:userId/ban'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, suspend_ban_dto_1.BanUserDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "ban", null);
__decorate([
    (0, common_1.Patch)('users/:userId/reinstate'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "reinstate", null);
__decorate([
    (0, common_1.Patch)('users/:userId/role'),
    (0, common_1.UseGuards)(superadmin_guard_1.SuperAdminGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_user_role_dto_1.UpdateUserRoleDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Get)('users/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getUser", null);
exports.AdminController = AdminController = __decorate([
    (0, throttle_decorator_1.SkipAllThrottlers)(),
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map