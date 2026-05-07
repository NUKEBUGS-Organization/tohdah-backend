import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Trip, TripDocument, PricingType, TripStatus } from './schemas/trip.schema';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { BrowseTripsQueryDto } from './dto/browse-trips-query.dto';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class TripsService {
  constructor(
    @InjectModel(Trip.name) private readonly tripModel: Model<TripDocument>,
  ) {}

  assertDateOrder(departure: Date, arrival: Date): void {
    if (arrival <= departure) {
      throw new BadRequestException('arrivalDate must be after departureDate');
    }
  }

  assertPricing(pricingType: PricingType, pricePerKg: number | undefined): void {
    if (pricingType === 'fixed' && (pricePerKg === undefined || pricePerKg === null)) {
      throw new BadRequestException('pricePerKg is required when pricingType is fixed');
    }
  }

  async create(travelerId: string, dto: CreateTripDto): Promise<TripDocument> {
    const departureDate = new Date(dto.departureDate);
    const arrivalDate = new Date(dto.arrivalDate);
    this.assertDateOrder(departureDate, arrivalDate);
    this.assertPricing(dto.pricingType, dto.pricePerKg);

    const trip = await this.tripModel.create({
      travelerId: new Types.ObjectId(travelerId),
      origin: dto.origin.trim(),
      destination: dto.destination.trim(),
      departureDate,
      arrivalDate,
      luggageSpace: dto.luggageSpace,
      acceptedCategories: dto.acceptedCategories ?? [],
      deliveryPreferences: dto.deliveryPreferences?.trim(),
      pricingType: dto.pricingType,
      pricePerKg: dto.pricePerKg,
      notes: dto.notes?.trim(),
      openToCommunitySupport: dto.openToCommunitySupport ?? false,
      willingToAssistElderly: dto.willingToAssistElderly ?? false,
      acceptReducedFee: dto.acceptReducedFee ?? false,
      acceptVolunteer: dto.acceptVolunteer ?? false,
      status: 'active',
      matchedRequestsCount: 0,
    });
    return trip;
  }

  async getMyTrips(
    travelerId: string,
    status?: TripStatus,
  ): Promise<TripDocument[]> {
    const filter: Record<string, unknown> = {
      travelerId: new Types.ObjectId(travelerId),
    };
    if (status) {
      filter.status = status;
    }
    return this.tripModel
      .find(filter)
      .sort({ departureDate: -1 })
      .exec();
  }

  async findByIdOrThrow(id: string): Promise<TripDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Trip not found');
    }
    const trip = await this.tripModel
      .findById(id)
      .populate('travelerId', 'fullName profilePhoto')
      .exec();
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    return trip;
  }

  async update(
    travelerId: string,
    id: string,
    dto: UpdateTripDto,
  ): Promise<TripDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Trip not found');
    }
    const trip = await this.tripModel.findById(id).exec();
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    if (trip.travelerId.toString() !== travelerId) {
      throw new ForbiddenException('You can only edit your own trips');
    }
    if (trip.status === 'completed' || trip.status === 'cancelled') {
      throw new BadRequestException('Cannot edit a completed or cancelled trip');
    }

    const nextDeparture =
      dto.departureDate !== undefined
        ? new Date(dto.departureDate)
        : trip.departureDate;
    const nextArrival =
      dto.arrivalDate !== undefined ? new Date(dto.arrivalDate) : trip.arrivalDate;
    this.assertDateOrder(nextDeparture, nextArrival);

    const nextPricing = dto.pricingType ?? trip.pricingType;
    const nextPrice =
      dto.pricePerKg !== undefined ? dto.pricePerKg : trip.pricePerKg;
    this.assertPricing(nextPricing, nextPrice);

    if (dto.origin !== undefined) trip.origin = dto.origin.trim();
    if (dto.destination !== undefined) trip.destination = dto.destination.trim();
    if (dto.departureDate !== undefined) trip.departureDate = nextDeparture;
    if (dto.arrivalDate !== undefined) trip.arrivalDate = nextArrival;
    if (dto.luggageSpace !== undefined) trip.luggageSpace = dto.luggageSpace;
    if (dto.acceptedCategories !== undefined) {
      trip.acceptedCategories = dto.acceptedCategories;
    }
    if (dto.deliveryPreferences !== undefined) {
      trip.deliveryPreferences = dto.deliveryPreferences?.trim();
    }
    if (dto.pricingType !== undefined) trip.pricingType = dto.pricingType;
    if (dto.pricePerKg !== undefined) trip.pricePerKg = dto.pricePerKg;
    if (dto.notes !== undefined) trip.notes = dto.notes?.trim();
    if (dto.openToCommunitySupport !== undefined) {
      trip.openToCommunitySupport = dto.openToCommunitySupport;
    }
    if (dto.willingToAssistElderly !== undefined) {
      trip.willingToAssistElderly = dto.willingToAssistElderly;
    }
    if (dto.acceptReducedFee !== undefined) {
      trip.acceptReducedFee = dto.acceptReducedFee;
    }
    if (dto.acceptVolunteer !== undefined) {
      trip.acceptVolunteer = dto.acceptVolunteer;
    }

    return trip.save();
  }

  async cancelTrip(travelerId: string, id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Trip not found');
    }
    const trip = await this.tripModel.findById(id).exec();
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    if (trip.travelerId.toString() !== travelerId) {
      throw new ForbiddenException('You can only cancel your own trips');
    }
    if (trip.status === 'cancelled') {
      throw new BadRequestException('Trip already cancelled');
    }
    if (trip.status === 'completed') {
      throw new BadRequestException('Cannot cancel a completed trip');
    }
    trip.status = 'cancelled';
    await trip.save();
    return { message: 'Trip cancelled' };
  }

  async browse(query: BrowseTripsQueryDto): Promise<{
    data: TripDocument[] | Record<string, unknown>[];
    total: number;
    page: number;
    limit: number;
  }> {
    const filter: Record<string, unknown> = { status: 'active' };

    if (query.origin?.trim()) {
      filter.origin = {
        $regex: new RegExp(escapeRegex(query.origin.trim()), 'i'),
      };
    }
    if (query.destination?.trim()) {
      filter.destination = {
        $regex: new RegExp(escapeRegex(query.destination.trim()), 'i'),
      };
    }

    const depRange: { $gte?: Date; $lte?: Date } = {};
    if (query.dateFrom) {
      depRange.$gte = new Date(query.dateFrom);
    }
    if (query.dateTo) {
      const end = new Date(query.dateTo);
      end.setHours(23, 59, 59, 999);
      depRange.$lte = end;
    }
    if (Object.keys(depRange).length > 0) {
      filter.departureDate = depRange;
    }

    if (query.luggageSpace) {
      filter.luggageSpace = query.luggageSpace;
    }

    if (query.category?.trim()) {
      filter.acceptedCategories = query.category.trim();
    }

    if (query.maxPrice !== undefined && query.maxPrice !== null) {
      filter.$or = [
        { pricingType: 'negotiable' },
        {
          pricingType: 'fixed',
          pricePerKg: { $lte: query.maxPrice },
        },
      ];
    }

    if (query.socialImpact === true) {
      filter.openToCommunitySupport = true;
    }

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 10));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.tripModel
        .find(filter)
        .sort({ departureDate: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.tripModel.countDocuments(filter).exec(),
    ]);

    return { data: data as TripDocument[], total, page, limit };
  }
}
