import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export const ACCOUNT_TYPES = ['traveler', 'requester', 'both'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const USER_ROLES = ['user', 'admin', 'superadmin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ACCOUNT_STATUSES = ['active', 'suspended', 'banned'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const LOYALTY_TIERS = ['bronze', 'silver', 'gold'] as const;
export type LoyaltyTier = (typeof LOYALTY_TIERS)[number];

export const AUTH_PROVIDERS = ['local', 'google'] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  phoneNumber: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({
    type: String,
    enum: AUTH_PROVIDERS,
    default: 'local',
  })
  authProvider: AuthProvider;

  /** Google `sub`; unique sparse index defined on schema. */
  @Prop({ required: false, trim: true })
  googleId?: string;

  @Prop({
    type: String,
    enum: ACCOUNT_TYPES,
    required: false,
  })
  accountType?: AccountType;

  /** @deprecated Refresh sessions live in Redis (`tohdah:refresh:*`). Kept for legacy documents. */
  @Prop({ required: false })
  refreshTokenHash?: string;

  /** @deprecated OTP lives in Redis (`tohdah:otp:{email}`). Kept for legacy documents. */
  @Prop({ required: false })
  otpCode?: string;

  /** @deprecated See `otpCode`. */
  @Prop({ required: false, type: Date })
  otpExpiry?: Date;

  @Prop({ type: Boolean, default: false })
  isVerified: boolean;

  @Prop({ required: false, trim: true })
  profilePhoto?: string;

  @Prop({ required: false, trim: true })
  bio?: string;

  @Prop({ required: false, trim: true })
  location?: string;

  @Prop({ type: [String], default: undefined })
  languages?: string[];

  @Prop({ type: [String], default: undefined })
  travelPreferences?: string[];

  @Prop({ type: Boolean, default: false })
  isEmailVerified: boolean;

  @Prop({ type: Boolean, default: false })
  isPhoneVerified: boolean;

  @Prop({ type: Boolean, default: false })
  isIdVerified: boolean;

  @Prop({ type: Boolean, default: false })
  isSelfieVerified: boolean;

  /** Average visible review rating (1–5), two decimals maintained by ReviewsService */
  @Prop({ type: Number, default: 0 })
  rating: number;

  /** Count of visible reviews as reviewee */
  @Prop({ type: Number, default: 0 })
  reviewCount: number;

  @Prop({ type: Boolean, default: false })
  onboardingCompleted: boolean;

  /** Last completed onboarding step index (0 = none completed, …, 4 = finished). */
  @Prop({ type: Number, default: 0 })
  onboardingStep: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  blockedUsers: Types.ObjectId[];

  @Prop({ type: String, enum: USER_ROLES, default: 'user' })
  role: UserRole;

  @Prop({ type: String, enum: ACCOUNT_STATUSES, default: 'active' })
  accountStatus: AccountStatus;

  @Prop({ required: false, trim: true })
  suspensionReason?: string;

  @Prop({ type: Date, required: false })
  suspendedAt?: Date;

  @Prop({ type: Date, required: false })
  bannedAt?: Date;

  /** Unique 8-char code; generated on registration (sparse for legacy users). */
  @Prop({ required: false, unique: true, sparse: true, uppercase: true, trim: true })
  referralCode?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  referredBy?: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  loyaltyPoints: number;

  @Prop({ type: String, enum: LOYALTY_TIERS, default: 'bronze' })
  loyaltyTier: LoyaltyTier;

  /** FCM device tokens (web/mobile); $addToSet on register. */
  @Prop({ type: [String], default: [] })
  fcmTokens: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ accountStatus: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ googleId: 1 }, { unique: true, sparse: true });
