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
exports.TripSchema = exports.Trip = exports.TRIP_STATUSES = exports.PRICING_TYPES = exports.LUGGAGE_SPACES = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
exports.LUGGAGE_SPACES = ['small', 'medium', 'large'];
exports.PRICING_TYPES = ['fixed', 'negotiable'];
exports.TRIP_STATUSES = ['active', 'completed', 'cancelled'];
let Trip = class Trip {
    travelerId;
    origin;
    destination;
    departureDate;
    arrivalDate;
    luggageSpace;
    acceptedCategories;
    deliveryPreferences;
    pricingType;
    pricePerKg;
    notes;
    status;
    openToCommunitySupport;
    willingToAssistElderly;
    acceptReducedFee;
    acceptVolunteer;
    matchedRequestsCount;
};
exports.Trip = Trip;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Trip.prototype, "travelerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Trip.prototype, "origin", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Trip.prototype, "destination", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true }),
    __metadata("design:type", Date)
], Trip.prototype, "departureDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true }),
    __metadata("design:type", Date)
], Trip.prototype, "arrivalDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: exports.LUGGAGE_SPACES, required: true }),
    __metadata("design:type", String)
], Trip.prototype, "luggageSpace", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Trip.prototype, "acceptedCategories", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Trip.prototype, "deliveryPreferences", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: exports.PRICING_TYPES, required: true }),
    __metadata("design:type", String)
], Trip.prototype, "pricingType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, type: Number }),
    __metadata("design:type", Number)
], Trip.prototype, "pricePerKg", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Trip.prototype, "notes", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: exports.TRIP_STATUSES,
        default: 'active',
    }),
    __metadata("design:type", String)
], Trip.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Trip.prototype, "openToCommunitySupport", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Trip.prototype, "willingToAssistElderly", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Trip.prototype, "acceptReducedFee", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Trip.prototype, "acceptVolunteer", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Trip.prototype, "matchedRequestsCount", void 0);
exports.Trip = Trip = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Trip);
exports.TripSchema = mongoose_1.SchemaFactory.createForClass(Trip);
exports.TripSchema.index({ travelerId: 1, status: 1 });
exports.TripSchema.index({ origin: 1, destination: 1 });
exports.TripSchema.index({ departureDate: 1 });
exports.TripSchema.index({ status: 1, openToCommunitySupport: 1 });
//# sourceMappingURL=trip.schema.js.map