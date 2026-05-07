import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReviewDocument = HydratedDocument<Review>;

@Schema({ _id: false })
export class CategoryRatings {
  @Prop({ required: false, min: 1, max: 5 })
  communication?: number;

  @Prop({ required: false, min: 1, max: 5 })
  reliability?: number;

  @Prop({ required: false, min: 1, max: 5 })
  itemCare?: number;

  @Prop({ required: false, min: 1, max: 5 })
  punctuality?: number;
}

const CategoryRatingsSchema = SchemaFactory.createForClass(CategoryRatings);

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
  bookingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reviewerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  revieweeId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1, max: 5 })
  overallRating: number;

  @Prop({ type: CategoryRatingsSchema, required: false })
  categoryRatings?: CategoryRatings;

  @Prop({ required: false, trim: true, maxlength: 1000 })
  comment?: string;

  @Prop({ type: Boolean, default: true })
  isVisible: boolean;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
ReviewSchema.index({ bookingId: 1, reviewerId: 1 }, { unique: true });
ReviewSchema.index({ revieweeId: 1, isVisible: 1 });
