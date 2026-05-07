import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserReportDocument = HydratedDocument<UserReport>;

export const REPORT_REASONS = ['spam', 'fraud', 'harassment', 'fake_profile', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_STATUSES = ['pending', 'reviewed', 'resolved'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

@Schema({ timestamps: true })
export class UserReport {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  targetUserId: Types.ObjectId;

  @Prop({ type: String, enum: REPORT_REASONS, required: true })
  reason: ReportReason;

  @Prop({ required: false, trim: true, maxlength: 500 })
  description?: string;

  @Prop({ type: String, enum: REPORT_STATUSES, default: 'pending' })
  status: ReportStatus;
}

export const UserReportSchema = SchemaFactory.createForClass(UserReport);
