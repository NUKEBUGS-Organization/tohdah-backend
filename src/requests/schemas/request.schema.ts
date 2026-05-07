import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RequestDocument = HydratedDocument<Request>;

export const REQUEST_TYPES = ['standard', 'support'] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export const ITEM_CATEGORIES = [
  'documents',
  'clothing',
  'electronics',
  'food',
  'gifts',
  'other',
] as const;
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export const ITEM_SIZES = ['small', 'medium', 'large'] as const;
export type ItemSize = (typeof ITEM_SIZES)[number];

export const PAYMENT_TYPES = ['full', 'reduced', 'sponsored', 'volunteer'] as const;
export type SupportPaymentType = (typeof PAYMENT_TYPES)[number];

export const BENEFICIARY_TYPES = [
  'elderly',
  'limited_mobility',
  'essential_care',
  'community',
  'urgent',
] as const;
export type BeneficiaryType = (typeof BENEFICIARY_TYPES)[number];

export const URGENCY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

export const REQUEST_STATUSES = [
  'pending',
  'matched',
  'confirmed',
  'in_transit',
  'delivered',
  'completed',
  'cancelled',
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const ADMIN_APPROVAL_STATUSES = [
  'pending_review',
  'approved',
  'rejected',
] as const;
export type AdminApprovalStatus = (typeof ADMIN_APPROVAL_STATUSES)[number];

@Schema({ timestamps: true })
export class Request {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requesterId: Types.ObjectId;

  @Prop({ type: String, enum: REQUEST_TYPES, required: true })
  type: RequestType;

  @Prop({ required: true, trim: true })
  itemName: string;

  @Prop({ required: true, trim: true })
  itemDescription: string;

  @Prop({ type: String, enum: ITEM_CATEGORIES, required: true })
  itemCategory: ItemCategory;

  @Prop({ type: String, enum: ITEM_SIZES, required: true })
  itemSize: ItemSize;

  @Prop({ required: false, type: Number })
  estimatedValue?: number;

  @Prop({ required: true, trim: true })
  origin: string;

  @Prop({ required: true, trim: true })
  destination: string;

  @Prop({ type: Date, required: true })
  deliveryDeadline: Date;

  @Prop({ required: false, type: Number })
  budget?: number;

  @Prop({ type: String, default: 'USD', trim: true })
  currency: string;

  @Prop({ type: String, enum: PAYMENT_TYPES, required: false })
  paymentType?: SupportPaymentType;

  @Prop({ required: false, trim: true })
  beneficiaryName?: string;

  @Prop({ type: String, enum: BENEFICIARY_TYPES, required: false })
  beneficiaryType?: BeneficiaryType;

  @Prop({
    type: String,
    enum: URGENCY_LEVELS,
    default: 'low',
  })
  urgencyLevel: UrgencyLevel;

  @Prop({ required: false, trim: true })
  supportingNotes?: string;

  @Prop({
    type: String,
    enum: REQUEST_STATUSES,
    default: 'pending',
  })
  status: RequestStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  matchedTravelerId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Trip', required: false })
  matchedTripId?: Types.ObjectId;

  @Prop({ type: String, enum: ADMIN_APPROVAL_STATUSES, required: false })
  adminApprovalStatus?: AdminApprovalStatus;

  @Prop({ required: false, trim: true })
  adminApprovalNotes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  adminReviewedBy?: Types.ObjectId;

  @Prop({ type: Date, required: false })
  adminReviewedAt?: Date;
}

export const RequestSchema = SchemaFactory.createForClass(Request);

RequestSchema.index({ requesterId: 1, status: 1 });
RequestSchema.index({ origin: 1, destination: 1 });
RequestSchema.index({ type: 1, status: 1 });
RequestSchema.index({ urgencyLevel: 1, deliveryDeadline: 1 });
