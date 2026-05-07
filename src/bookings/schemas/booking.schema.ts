import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BookingDocument = HydratedDocument<Booking>;

export const BOOKING_STATUSES = [
  'pending_acceptance',
  'countered',
  'confirmed',
  'paid',
  'in_transit',
  'delivered',
  'completed',
  'cancelled',
  'disputed',
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

@Schema({ timestamps: true })
export class Booking {
  @Prop({ required: true, unique: true, trim: true })
  bookingRef: string;

  @Prop({ type: Types.ObjectId, ref: 'Request', required: true })
  requestId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Trip', required: true })
  tripId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requesterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  travelerId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  offeredFee: number;

  @Prop({ type: Number, required: false })
  counterFee?: number;

  @Prop({ type: Number, required: false })
  agreedFee?: number;

  @Prop({ type: Number, default: 10 })
  platformCommissionPct: number;

  @Prop({ type: Number, required: false })
  platformCommission?: number;

  @Prop({ type: Number, required: false })
  travelerPayout?: number;

  @Prop({ type: String, default: 'USD', trim: true })
  currency: string;

  @Prop({
    type: String,
    enum: BOOKING_STATUSES,
    default: 'pending_acceptance',
  })
  status: BookingStatus;

  @Prop({ required: false, trim: true })
  podPhotoUrl?: string;

  @Prop({ required: false, trim: true })
  podConfirmationCode?: string;

  @Prop({ type: Date, required: false })
  podSubmittedAt?: Date;

  @Prop({ required: false, trim: true })
  disputeReason?: string;

  @Prop({ type: Date, required: false })
  disputeRaisedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  disputeRaisedBy?: Types.ObjectId;

  @Prop({ required: false, trim: true })
  disputeResolution?: string;

  @Prop({ type: Date, required: false })
  disputeResolvedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  disputeResolvedBy?: Types.ObjectId;

  @Prop({ type: Number, required: false })
  refundAmount?: number;

  /** When the booking reached completed status (payment/settlement analytics). */
  @Prop({ type: Date, required: false })
  completedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  cancelledBy?: Types.ObjectId;

  @Prop({ type: Date, required: false })
  cancelledAt?: Date;

  @Prop({ required: false, trim: true })
  cancellationReason?: string;

  /** Stub payment identifier until Stripe integration. */
  @Prop({ required: false, trim: true })
  paymentMethodId?: string;

  /** Stripe PaymentIntent id (set when payment succeeds via webhook). */
  @Prop({ required: false, trim: true })
  paymentIntentId?: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

BookingSchema.index({ requesterId: 1, status: 1 });
BookingSchema.index({ travelerId: 1, status: 1 });
BookingSchema.index({ requestId: 1 });
BookingSchema.index({ tripId: 1 });
BookingSchema.index({ status: 1 });
