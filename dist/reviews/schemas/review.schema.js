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
exports.ReviewSchema = exports.Review = exports.CategoryRatings = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let CategoryRatings = class CategoryRatings {
    communication;
    reliability;
    itemCare;
    punctuality;
};
exports.CategoryRatings = CategoryRatings;
__decorate([
    (0, mongoose_1.Prop)({ required: false, min: 1, max: 5 }),
    __metadata("design:type", Number)
], CategoryRatings.prototype, "communication", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, min: 1, max: 5 }),
    __metadata("design:type", Number)
], CategoryRatings.prototype, "reliability", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, min: 1, max: 5 }),
    __metadata("design:type", Number)
], CategoryRatings.prototype, "itemCare", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, min: 1, max: 5 }),
    __metadata("design:type", Number)
], CategoryRatings.prototype, "punctuality", void 0);
exports.CategoryRatings = CategoryRatings = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], CategoryRatings);
const CategoryRatingsSchema = mongoose_1.SchemaFactory.createForClass(CategoryRatings);
let Review = class Review {
    bookingId;
    reviewerId;
    revieweeId;
    overallRating;
    categoryRatings;
    comment;
    isVisible;
};
exports.Review = Review;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Booking', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Review.prototype, "bookingId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Review.prototype, "reviewerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Review.prototype, "revieweeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true, min: 1, max: 5 }),
    __metadata("design:type", Number)
], Review.prototype, "overallRating", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: CategoryRatingsSchema, required: false }),
    __metadata("design:type", CategoryRatings)
], Review.prototype, "categoryRatings", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true, maxlength: 1000 }),
    __metadata("design:type", String)
], Review.prototype, "comment", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: true }),
    __metadata("design:type", Boolean)
], Review.prototype, "isVisible", void 0);
exports.Review = Review = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Review);
exports.ReviewSchema = mongoose_1.SchemaFactory.createForClass(Review);
exports.ReviewSchema.index({ bookingId: 1, reviewerId: 1 }, { unique: true });
exports.ReviewSchema.index({ revieweeId: 1, isVisible: 1 });
//# sourceMappingURL=review.schema.js.map