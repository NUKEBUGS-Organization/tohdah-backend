"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const users_module_1 = require("../users/users.module");
const trips_module_1 = require("../trips/trips.module");
const requests_module_1 = require("../requests/requests.module");
const bookings_module_1 = require("../bookings/bookings.module");
const notifications_module_1 = require("../notifications/notifications.module");
const admin_controller_1 = require("./admin.controller");
const admin_service_1 = require("./admin.service");
const admin_guard_1 = require("../auth/guards/admin.guard");
const superadmin_guard_1 = require("../auth/guards/superadmin.guard");
const payments_module_1 = require("../payments/payments.module");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            trips_module_1.TripsModule,
            requests_module_1.RequestsModule,
            bookings_module_1.BookingsModule,
            notifications_module_1.NotificationsModule,
            payments_module_1.PaymentsModule,
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [admin_service_1.AdminService, admin_guard_1.AdminGuard, superadmin_guard_1.SuperAdminGuard],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map