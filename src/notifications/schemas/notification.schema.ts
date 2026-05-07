import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export const NOTIFICATION_TYPES = [
  'new_match',
  'booking_accepted',
  'booking_countered',
  'booking_declined',
  'counter_accepted',
  'payment_received',
  'in_transit',
  'delivery_proof',
  'booking_completed',
  'dispute_raised',
  'booking_cancelled',
  'new_message',
  'review_request',
  'support_request_approved',
  'otp_verified',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: NOTIFICATION_TYPES, required: true })
  type: NotificationType;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  body: string;

  @Prop({ type: Boolean, default: false })
  isRead: boolean;

  @Prop({ type: Date, required: false })
  readAt?: Date;

  @Prop({ type: MongooseSchema.Types.Mixed, required: false })
  metadata?: Record<string, unknown>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
