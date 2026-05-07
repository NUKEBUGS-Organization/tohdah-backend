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
exports.RequestSchema = exports.Request = exports.ADMIN_APPROVAL_STATUSES = exports.REQUEST_STATUSES = exports.URGENCY_LEVELS = exports.BENEFICIARY_TYPES = exports.PAYMENT_TYPES = exports.ITEM_SIZES = exports.ITEM_CATEGORIES = exports.REQUEST_TYPES = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
exports.REQUEST_TYPES = ['standard', 'support'];
exports.ITEM_CATEGORIES = [
    'documents',
    'clothing',
    'electronics',
    'food',
    'gifts',
    'other',
];
exports.ITEM_SIZES = ['small', 'medium', 'large'];
exports.PAYMENT_TYPES = ['full', 'reduced', 'sponsored', 'volunteer'];
exports.BENEFICIARY_TYPES = [
    'elderly',
    'limited_mobility',
    'essential_care',
    'community',
    'urgent',
];
exports.URGENCY_LEVELS = ['low', 'medium', 'high', 'critical'];
exports.REQUEST_STATUSES = [
    'pending',
    'matched',
    'confirmed',
    'in_transit',
    'delivered',
    'completed',
    'cancelled',
];
exports.ADMIN_APPROVAL_STATUSES = [
    'pending_review',
    'approved',
    'rejected',
];
let Request = class Request {
    requesterId;
    type;
    itemName;
    itemDescription;
    itemCategory;
    itemSize;
    estimatedValue;
    origin;
    destination;
    deliveryDeadline;
    budget;
    currency;
    paymentType;
    beneficiaryName;
    beneficiaryType;
    urgencyLevel;
    supportingNotes;
    status;
    matchedTravelerId;
    matchedTripId;
    adminApprovalStatus;
    adminApprovalNotes;
    adminReviewedBy;
    adminReviewedAt;
};
exports.Request = Request;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Request.prototype, "requesterId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: exports.REQUEST_TYPES, required: true }),
    __metadata("design:type", String)
], Request.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Request.prototype, "itemName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Request.prototype, "itemDescription", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: exports.ITEM_CATEGORIES, required: true }),
    __metadata("design:type", String)
], Request.prototype, "itemCategory", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: exports.ITEM_SIZES, required: true }),
    __metadata("design:type", String)
], Request.prototype, "itemSize", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, type: Number }),
    __metadata("design:type", Number)
], Request.prototype, "estimatedValue", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Request.prototype, "origin", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Request.prototype, "destination", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true }),
    __metadata("design:type", Date)
], Request.prototype, "deliveryDeadline", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, type: Number }),
    __metadata("design:type", Number)
], Request.prototype, "budget", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: 'USD', trim: true }),
    __metadata("design:type", String)
], Request.prototype, "currency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: exports.PAYMENT_TYPES, required: false }),
    __metadata("design:type", String)
], Request.prototype, "paymentType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Request.prototype, "beneficiaryName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: exports.BENEFICIARY_TYPES, required: false }),
    __metadata("design:type", String)
], Request.prototype, "beneficiaryType", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: exports.URGENCY_LEVELS,
        default: 'low',
    }),
    __metadata("design:type", String)
], Request.prototype, "urgencyLevel", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Request.prototype, "supportingNotes", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: exports.REQUEST_STATUSES,
        default: 'pending',
    }),
    __metadata("design:type", String)
], Request.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Request.prototype, "matchedTravelerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Trip', required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Request.prototype, "matchedTripId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: exports.ADMIN_APPROVAL_STATUSES, required: false }),
    __metadata("design:type", String)
], Request.prototype, "adminApprovalStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Request.prototype, "adminApprovalNotes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Request.prototype, "adminReviewedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: false }),
    __metadata("design:type", Date)
], Request.prototype, "adminReviewedAt", void 0);
exports.Request = Request = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Request);
exports.RequestSchema = mongoose_1.SchemaFactory.createForClass(Request);
exports.RequestSchema.index({ requesterId: 1, status: 1 });
exports.RequestSchema.index({ origin: 1, destination: 1 });
exports.RequestSchema.index({ type: 1, status: 1 });
exports.RequestSchema.index({ urgencyLevel: 1, deliveryDeadline: 1 });
//# sourceMappingURL=request.schema.js.map