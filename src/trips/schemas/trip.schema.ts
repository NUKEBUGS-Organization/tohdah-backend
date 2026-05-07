import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TripDocument = HydratedDocument<Trip>;

export const LUGGAGE_SPACES = ['small', 'medium', 'large'] as const;
export type LuggageSpace = (typeof LUGGAGE_SPACES)[number];

export const PRICING_TYPES = ['fixed', 'negotiable'] as const;
export type PricingType = (typeof PRICING_TYPES)[number];

export const TRIP_STATUSES = ['active', 'completed', 'cancelled'] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

@Schema({ timestamps: true })
export class Trip {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  travelerId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  origin: string;

  @Prop({ required: true, trim: true })
  destination: string;

  @Prop({ type: Date, required: true })
  departureDate: Date;

  @Prop({ type: Date, required: true })
  arrivalDate: Date;

  @Prop({ type: String, enum: LUGGAGE_SPACES, required: true })
  luggageSpace: LuggageSpace;

  @Prop({ type: [String], default: [] })
  acceptedCategories: string[];

  @Prop({ required: false, trim: true })
  deliveryPreferences?: string;

  @Prop({ type: String, enum: PRICING_TYPES, required: true })
  pricingType: PricingType;

  @Prop({ required: false, type: Number })
  pricePerKg?: number;

  @Prop({ required: false, trim: true })
  notes?: string;

  @Prop({
    type: String,
    enum: TRIP_STATUSES,
    default: 'active',
  })
  status: TripStatus;

  @Prop({ type: Boolean, default: false })
  openToCommunitySupport: boolean;

  @Prop({ type: Boolean, default: false })
  willingToAssistElderly: boolean;

  @Prop({ type: Boolean, default: false })
  acceptReducedFee: boolean;

  @Prop({ type: Boolean, default: false })
  acceptVolunteer: boolean;

  @Prop({ type: Number, default: 0 })
  matchedRequestsCount: number;
}

export const TripSchema = SchemaFactory.createForClass(Trip);

TripSchema.index({ travelerId: 1, status: 1 });
TripSchema.index({ origin: 1, destination: 1 });
TripSchema.index({ departureDate: 1 });
TripSchema.index({ status: 1, openToCommunitySupport: 1 });
