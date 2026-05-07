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
exports.BookingSchema = exports.Booking = exports.BOOKING_STATUSES = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
exports.BOOKING_STATUSES = [
    'pending_acceptance',
    'countered',
    'confirmed',
    'paid',
    'in_transit',
    'delivered',
    'completed',
    'cancelled',
    'disputed',
];
let Booking = class Booking {
    bookingRef;
    requestId;
    tripId;
    requesterId;
    travelerId;
    offeredFee;
    counterFee;
    agreedFee;
    platformCommissionPct;
    platformCommission;
    travelerPayout;
    currency;
    status;
    podPhotoUrl;
    podConfirmationCode;
    podSubmittedAt;
    disputeReason;
    disputeRaisedAt;
    disputeRaisedBy;
    disputeResolution;
    disputeResolvedAt;
    disputeResolvedBy;
    refundAmount;
    completedAt;
    cancelledBy;
    cancelledAt;
    cancellationReason;
    paymentMethodId;
    paymentIntentId;
};
exports.Booking = Booking;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, trim: true }),
    __metadata("design:type", String)
], Booking.prototype, "bookingRef", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Request', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Booking.prototype, "requestId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Trip', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Booking.prototype, "tripId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Booking.prototype, "requesterId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Booking.prototype, "travelerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], Booking.prototype, "offeredFee", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: false }),
    __metadata("design:type", Number)
], Booking.prototype, "counterFee", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: false }),
    __metadata("design:type", Number)
], Booking.prototype, "agreedFee", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 10 }),
    __metadata("design:type", Number)
], Booking.prototype, "platformCommissionPct", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: false }),
    __metadata("design:type", Number)
], Booking.prototype, "platformCommission", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: false }),
    __metadata("design:type", Number)
], Booking.prototype, "travelerPayout", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: 'USD', trim: true }),
    __metadata("design:type", String)
], Booking.prototype, "currency", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: exports.BOOKING_STATUSES,
        default: 'pending_acceptance',
    }),
    __metadata("design:type", String)
], Booking.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Booking.prototype, "podPhotoUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Booking.prototype, "podConfirmationCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: false }),
    __metadata("design:type", Date)
], Booking.prototype, "podSubmittedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Booking.prototype, "disputeReason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: false }),
    __metadata("design:type", Date)
], Booking.prototype, "disputeRaisedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Booking.prototype, "disputeRaisedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Booking.prototype, "disputeResolution", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: false }),
    __metadata("design:type", Date)
], Booking.prototype, "disputeResolvedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Booking.prototype, "disputeResolvedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: false }),
    __metadata("design:type", Number)
], Booking.prototype, "refundAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: false }),
    __metadata("design:type", Date)
], Booking.prototype, "completedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Booking.prototype, "cancelledBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: false }),
    __metadata("design:type", Date)
], Booking.prototype, "cancelledAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Booking.prototype, "cancellationReason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Booking.prototype, "paymentMethodId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Booking.prototype, "paymentIntentId", void 0);
exports.Booking = Booking = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Booking);
exports.BookingSchema = mongoose_1.SchemaFactory.createForClass(Booking);
exports.BookingSchema.index({ requesterId: 1, status: 1 });
exports.BookingSchema.index({ travelerId: 1, status: 1 });
exports.BookingSchema.index({ requestId: 1 });
exports.BookingSchema.index({ tripId: 1 });
exports.BookingSchema.index({ status: 1 });
//# sourceMappingURL=booking.schema.js.map