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
exports.UserSchema = exports.User = exports.AUTH_PROVIDERS = exports.LOYALTY_TIERS = exports.ACCOUNT_STATUSES = exports.USER_ROLES = exports.ACCOUNT_TYPES = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
exports.ACCOUNT_TYPES = ['traveler', 'requester', 'both'];
exports.USER_ROLES = ['user', 'admin', 'superadmin'];
exports.ACCOUNT_STATUSES = ['active', 'suspended', 'banned'];
exports.LOYALTY_TIERS = ['bronze', 'silver', 'gold'];
exports.AUTH_PROVIDERS = ['local', 'google'];
let User = class User {
    fullName;
    email;
    phoneNumber;
    passwordHash;
    authProvider;
    googleId;
    accountType;
    refreshTokenHash;
    otpCode;
    otpExpiry;
    isVerified;
    profilePhoto;
    bio;
    location;
    languages;
    travelPreferences;
    isEmailVerified;
    isPhoneVerified;
    isIdVerified;
    isSelfieVerified;
    rating;
    reviewCount;
    onboardingCompleted;
    onboardingStep;
    blockedUsers;
    role;
    accountStatus;
    suspensionReason;
    suspendedAt;
    bannedAt;
    referralCode;
    referredBy;
    loyaltyPoints;
    loyaltyTier;
    fcmTokens;
};
exports.User = User;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], User.prototype, "fullName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, lowercase: true, trim: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], User.prototype, "phoneNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: exports.AUTH_PROVIDERS,
        default: 'local',
    }),
    __metadata("design:type", String)
], User.prototype, "authProvider", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], User.prototype, "googleId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: exports.ACCOUNT_TYPES,
        required: false,
    }),
    __metadata("design:type", String)
], User.prototype, "accountType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], User.prototype, "refreshTokenHash", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], User.prototype, "otpCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, type: Date }),
    __metadata("design:type", Date)
], User.prototype, "otpExpiry", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isVerified", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], User.prototype, "profilePhoto", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], User.prototype, "bio", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], User.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: undefined }),
    __metadata("design:type", Array)
], User.prototype, "languages", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: undefined }),
    __metadata("design:type", Array)
], User.prototype, "travelPreferences", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isEmailVerified", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isPhoneVerified", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isIdVerified", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isSelfieVerified", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "rating", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "reviewCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "onboardingCompleted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "onboardingStep", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: mongoose_2.Types.ObjectId, ref: 'User' }], default: [] }),
    __metadata("design:type", Array)
], User.prototype, "blockedUsers", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: exports.USER_ROLES, default: 'user' }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: exports.ACCOUNT_STATUSES, default: 'active' }),
    __metadata("design:type", String)
], User.prototype, "accountStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], User.prototype, "suspensionReason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: false }),
    __metadata("design:type", Date)
], User.prototype, "suspendedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: false }),
    __metadata("design:type", Date)
], User.prototype, "bannedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, unique: true, sparse: true, uppercase: true, trim: true }),
    __metadata("design:type", String)
], User.prototype, "referralCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], User.prototype, "referredBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "loyaltyPoints", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: exports.LOYALTY_TIERS, default: 'bronze' }),
    __metadata("design:type", String)
], User.prototype, "loyaltyTier", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], User.prototype, "fcmTokens", void 0);
exports.User = User = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], User);
exports.UserSchema = mongoose_1.SchemaFactory.createForClass(User);
exports.UserSchema.index({ accountStatus: 1 });
exports.UserSchema.index({ role: 1 });
exports.UserSchema.index({ googleId: 1 }, { unique: true, sparse: true });
//# sourceMappingURL=user.schema.js.map