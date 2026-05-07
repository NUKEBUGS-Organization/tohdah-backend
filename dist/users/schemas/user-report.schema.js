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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserReportSchema = exports.UserReport = exports.REPORT_STATUSES = exports.REPORT_REASONS = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
exports.REPORT_REASONS = ['spam', 'fraud', 'harassment', 'fake_profile', 'other'];
exports.REPORT_STATUSES = ['pending', 'reviewed', 'resolved'];
let UserReport = class UserReport {
    reporterId;
    targetUserId;
    reason;
    description;
    status;
};
exports.UserReport = UserReport;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], UserReport.prototype, "reporterId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], UserReport.prototype, "targetUserId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: exports.REPORT_REASONS, required: true }),
    __metadata("design:type", String)
], UserReport.prototype, "reason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true, maxlength: 500 }),
    __metadata("design:type", String)
], UserReport.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: exports.REPORT_STATUSES, default: 'pending' }),
    __metadata("design:type", String)
], UserReport.prototype, "status", void 0);
exports.UserReport = UserReport = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], UserReport);
exports.UserReportSchema = mongoose_1.SchemaFactory.createForClass(UserReport);
//# sourceMappingURL=user-report.schema.js.map