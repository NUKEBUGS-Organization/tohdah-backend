import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomInt } from 'crypto';
import { Booking, BookingDocument, BookingStatus } from './schemas/booking.schema';
import { Trip, TripDocument } from '../trips/schemas/trip.schema';
import { Request as RequestEntity, RequestDocument } from '../requests/schemas/request.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CounterOfferDto } from './dto/counter-offer.dto';
import { ProofOfDeliveryDto } from './dto/proof-of-delivery.dto';
import { DisputeDto } from './dto/dispute.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { PayBookingDto } from './dto/pay-booking.dto';
import { NotificationsService } from '../notifications/notifications.service';

const BOOKING_REF_PREFIX = 'TDH-';
const BOOKING_SUFFIX_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function randomBookingSuffix(): string {
  let s = '';
  for (let i = 0; i < 6; i++) {
    s += BOOKING_SUFFIX_CHARS[randomInt(BOOKING_SUFFIX_CHARS.length)];
  }
  return s;
}

function generatePodConfirmationCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

const POPULATE_MY_BOOKINGS = [
  'requestId',
  'tripId',
  {
    path: 'requesterId',
    select: 'fullName profilePhoto',
  },
  {
    path: 'travelerId',
    select: 'fullName profilePhoto',
  },
] as const;

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Trip.name) private readonly tripModel: Model<TripDocument>,
    @InjectModel(RequestEntity.name)
    private readonly requestModel: Model<RequestDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private notify(p: Promise<unknown>): void {
    void p.catch(() => undefined);
  }

  private async generateUniqueBookingRef(): Promise<string> {
    for (let i = 0; i < 30; i++) {
      const ref = `${BOOKING_REF_PREFIX}${randomBookingSuffix()}`;
      const clash = await this.bookingModel.exists({ bookingRef: ref });
      if (!clash) {
        return ref;
      }
    }
    throw new BadRequestException('Could not allocate booking reference');
  }

  private applyCommission(booking: BookingDocument, agreedFee: number): void {
    booking.agreedFee = agreedFee;
    const pct = booking.platformCommissionPct ?? 10;
    booking.platformCommission = (agreedFee * pct) / 100;
    booking.travelerPayout = agreedFee - booking.platformCommission;
  }

  private async revertMatch(booking: BookingDocument): Promise<void> {
    await this.requestModel
      .findByIdAndUpdate(booking.requestId, {
        $set: { status: 'pending' },
        $unset: { matchedTripId: 1, matchedTravelerId: 1 },
      })
      .exec();

    const trip = await this.tripModel.findById(booking.tripId).exec();
    if (trip) {
      trip.matchedRequestsCount = Math.max(0, (trip.matchedRequestsCount ?? 0) - 1);
      await trip.save();
    }
  }

  private async maybeCompleteTrip(tripId: Types.ObjectId): Promise<void> {
    const bookings = await this.bookingModel.find({ tripId }).exec();
    const relevant = bookings.filter((b) => b.status !== 'cancelled');
    if (relevant.length === 0) {
      return;
    }
    if (relevant.every((b) => b.status === 'completed')) {
      await this.tripModel
        .updateOne({ _id: tripId }, { $set: { status: 'completed' } })
        .exec();
    }
  }

  async createMatch(requesterUserId: string, dto: CreateBookingDto): Promise<BookingDocument> {
    const request = await this.requestModel.findById(dto.requestId).exec();
    if (!request) {
      throw new BadRequestException('Request not found');
    }
    if (request.requesterId.toString() !== requesterUserId) {
      throw new ForbiddenException('You can only match your own requests');
    }
    if (request.status !== 'pending') {
      throw new BadRequestException('Request must be pending to create a match');
    }

    const trip = await this.tripModel.findById(dto.tripId).exec();
    if (!trip) {
      throw new BadRequestException('Trip not found');
    }
    if (trip.status !== 'active') {
      throw new BadRequestException('Trip must be active');
    }

    if (dto.offeredFee <= 0) {
      throw new BadRequestException('offeredFee must be greater than 0');
    }

    const existingLink = await this.bookingModel
      .findOne({
        requestId: new Types.ObjectId(dto.requestId),
        tripId: new Types.ObjectId(dto.tripId),
        status: { $ne: 'cancelled' },
      })
      .exec();
    if (existingLink) {
      throw new BadRequestException(
        'A booking already exists for this request and trip',
      );
    }

    const bookingRef = await this.generateUniqueBookingRef();
    const podConfirmationCode = generatePodConfirmationCode();

    const booking = await this.bookingModel.create({
      bookingRef,
      requestId: new Types.ObjectId(dto.requestId),
      tripId: new Types.ObjectId(dto.tripId),
      requesterId: request.requesterId,
      travelerId: trip.travelerId,
      offeredFee: dto.offeredFee,
      currency: request.currency || 'USD',
      status: 'pending_acceptance',
      podConfirmationCode,
      platformCommissionPct: 10,
    });

    await this.requestModel
      .findByIdAndUpdate(request._id, {
        $set: {
          status: 'matched',
          matchedTripId: trip._id,
          matchedTravelerId: trip.travelerId,
        },
      })
      .exec();

    await this.tripModel
      .findByIdAndUpdate(trip._id, {
        $inc: { matchedRequestsCount: 1 },
      })
      .exec();

    const bid = booking._id.toString();
    this.notify(
      this.notificationsService.createNotification({
        userId: trip.travelerId,
        type: 'new_match',
        title: 'New delivery request',
        body: 'Someone wants you to carry an item on your trip.',
        metadata: {
          bookingId: bid,
          tripId: trip._id.toString(),
          requestId: request._id.toString(),
        },
      }),
    );

    return booking;
  }

  async acceptBooking(travelerUserId: string, bookingId: string): Promise<BookingDocument> {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.travelerId.toString() !== travelerUserId) {
      throw new ForbiddenException('Only the traveler can accept this booking');
    }
    if (
      booking.status !== 'pending_acceptance' &&
      booking.status !== 'countered'
    ) {
      throw new BadRequestException('Booking cannot be accepted in its current state');
    }

    const agreed =
      booking.status === 'countered'
        ? (booking.counterFee ?? 0)
        : booking.offeredFee;
    if (agreed <= 0) {
      throw new BadRequestException('Invalid agreed fee');
    }

    this.applyCommission(booking, agreed);
    booking.status = 'confirmed';
    await booking.save();

    const bid = booking._id.toString();
    this.notify(
      this.notificationsService.createNotification({
        userId: booking.requesterId,
        type: 'booking_accepted',
        title: 'Your booking was accepted!',
        body: 'A traveler accepted your delivery request.',
        metadata: { bookingId: bid },
      }),
    );

    return booking;
  }

  async counterOffer(
    travelerUserId: string,
    bookingId: string,
    dto: CounterOfferDto,
  ): Promise<BookingDocument> {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.travelerId.toString() !== travelerUserId) {
      throw new ForbiddenException('Only the traveler can counter this booking');
    }
    if (booking.status !== 'pending_acceptance') {
      throw new BadRequestException('Counter offer is not allowed in the current state');
    }
    if (dto.counterFee <= 0) {
      throw new BadRequestException('counterFee must be greater than 0');
    }

    booking.counterFee = dto.counterFee;
    booking.status = 'countered';
    await booking.save();

    const bid = booking._id.toString();
    this.notify(
      this.notificationsService.createNotification({
        userId: booking.requesterId,
        type: 'booking_countered',
        title: 'Counter-offer received',
        body: 'A traveler sent a counter-offer for your request.',
        metadata: { bookingId: bid, counterFee: dto.counterFee },
      }),
    );

    return booking;
  }

  async declineBooking(
    travelerUserId: string,
    bookingId: string,
  ): Promise<{ message: string }> {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.travelerId.toString() !== travelerUserId) {
      throw new ForbiddenException('Only the traveler can decline this booking');
    }
    if (
      booking.status !== 'pending_acceptance' &&
      booking.status !== 'countered'
    ) {
      throw new BadRequestException('Booking cannot be declined in its current state');
    }

    booking.status = 'cancelled';
    booking.cancelledBy = booking.travelerId;
    booking.cancelledAt = new Date();
    booking.cancellationReason = 'Declined by traveler';
    await booking.save();

    await this.revertMatch(booking);

    const bid = booking._id.toString();
    this.notify(
      this.notificationsService.createNotification({
        userId: booking.requesterId,
        type: 'booking_declined',
        title: 'Booking declined',
        body: 'A traveler declined your delivery request.',
        metadata: { bookingId: bid },
      }),
    );

    return { message: 'Booking declined' };
  }

  async acceptCounter(
    requesterUserId: string,
    bookingId: string,
  ): Promise<BookingDocument> {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.requesterId.toString() !== requesterUserId) {
      throw new ForbiddenException('Only the requester can accept the counter offer');
    }
    if (booking.status !== 'countered') {
      throw new BadRequestException('No counter offer to accept');
    }
    const counter = booking.counterFee ?? 0;
    if (counter <= 0) {
      throw new BadRequestException('Invalid counter fee');
    }

    this.applyCommission(booking, counter);
    booking.status = 'confirmed';
    await booking.save();

    const bid = booking._id.toString();
    this.notify(
      this.notificationsService.createNotification({
        userId: booking.travelerId,
        type: 'counter_accepted',
        title: 'Counter-offer accepted',
        body: 'The requester accepted your counter-offer.',
        metadata: { bookingId: bid },
      }),
    );

    return booking;
  }

  async pay(
    _requesterUserId: string,
    _bookingId: string,
    _dto: PayBookingDto,
  ): Promise<{ booking: BookingDocument; message: string }> {
    throw new GoneException(
      'Use POST /payments/intent/:bookingId to initiate payment. Stripe handles confirmation via webhook.',
    );
  }

  async markAsPaidFromWebhook(
    bookingId: string,
    paymentIntentId: string,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(bookingId)) {
      return;
    }
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      return;
    }
    if (booking.status === 'paid' && booking.paymentIntentId === paymentIntentId) {
      return;
    }
    if (booking.status !== 'confirmed') {
      return;
    }

    booking.paymentIntentId = paymentIntentId;
    booking.status = 'paid';
    await booking.save();

    const bid = booking._id.toString();
    this.notify(
      this.notificationsService.createNotification({
        userId: booking.travelerId,
        type: 'payment_received',
        title: 'Payment received',
        body: 'Payment has been captured for your delivery.',
        metadata: {
          bookingId: bid,
          agreedFee: booking.agreedFee,
        },
      }),
    );
  }

  async markInTransit(travelerUserId: string, bookingId: string): Promise<BookingDocument> {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.travelerId.toString() !== travelerUserId) {
      throw new ForbiddenException('Only the traveler can mark in transit');
    }
    if (booking.status !== 'paid') {
      throw new BadRequestException('Booking must be paid before in transit');
    }

    booking.status = 'in_transit';
    await booking.save();

    await this.requestModel
      .findByIdAndUpdate(booking.requestId, { $set: { status: 'in_transit' } })
      .exec();

    const bid = booking._id.toString();
    this.notify(
      this.notificationsService.createNotification({
        userId: booking.requesterId,
        type: 'in_transit',
        title: 'Your item is on its way',
        body: 'The traveler has picked up your item and is in transit.',
        metadata: { bookingId: bid },
      }),
    );

    return booking;
  }

  async submitProofOfDelivery(
    travelerUserId: string,
    bookingId: string,
    dto: ProofOfDeliveryDto,
  ): Promise<BookingDocument> {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.travelerId.toString() !== travelerUserId) {
      throw new ForbiddenException('Only the traveler can submit proof of delivery');
    }
    if (booking.status !== 'in_transit') {
      throw new BadRequestException('Booking must be in transit');
    }
    if (dto.podConfirmationCode !== booking.podConfirmationCode) {
      throw new BadRequestException('Invalid confirmation code');
    }

    booking.podPhotoUrl = dto.podPhotoUrl;
    booking.podSubmittedAt = new Date();
    booking.status = 'delivered';
    await booking.save();

    await this.requestModel
      .findByIdAndUpdate(booking.requestId, { $set: { status: 'delivered' } })
      .exec();

    const bid = booking._id.toString();
    this.notify(
      this.notificationsService.createNotification({
        userId: booking.requesterId,
        type: 'delivery_proof',
        title: 'Delivery proof submitted',
        body: 'The traveler has submitted proof of delivery.',
        metadata: { bookingId: bid },
      }),
    );

    return booking;
  }

  async completeBooking(
    requesterUserId: string,
    bookingId: string,
  ): Promise<BookingDocument> {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.requesterId.toString() !== requesterUserId) {
      throw new ForbiddenException('Only the requester can complete this booking');
    }
    if (booking.status !== 'delivered') {
      throw new BadRequestException('Booking must be delivered before completion');
    }

    booking.status = 'completed';
    booking.completedAt = new Date();
    await booking.save();

    await this.requestModel
      .findByIdAndUpdate(booking.requestId, { $set: { status: 'completed' } })
      .exec();

    await this.maybeCompleteTrip(booking.tripId);

    const bid = booking._id.toString();
    const parties = [
      booking.requesterId.toString(),
      booking.travelerId.toString(),
    ];
    for (const uid of parties) {
      this.notify(
        this.notificationsService.createNotification({
          userId: uid,
          type: 'booking_completed',
          title: 'Booking completed',
          body: 'Your booking has been completed successfully.',
          metadata: { bookingId: bid },
        }),
      );
      this.notify(
        this.notificationsService.createNotification({
          userId: uid,
          type: 'review_request',
          title: 'Leave a review',
          body: 'How was your experience? Share your feedback.',
          metadata: { bookingId: bid },
        }),
      );
    }

    return booking;
  }

  async raiseDispute(
    userId: string,
    bookingId: string,
    dto: DisputeDto,
  ): Promise<BookingDocument> {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    const uid = booking.requesterId.toString();
    const tid = booking.travelerId.toString();
    if (userId !== uid && userId !== tid) {
      throw new ForbiddenException('Only parties on the booking can raise a dispute');
    }

    const allowed: BookingStatus[] = ['paid', 'in_transit', 'delivered'];
    if (!allowed.includes(booking.status)) {
      throw new BadRequestException('Dispute is not allowed in the current state');
    }

    booking.status = 'disputed';
    booking.disputeReason = dto.reason;
    booking.disputeRaisedAt = new Date();
    booking.disputeRaisedBy = new Types.ObjectId(userId);
    await booking.save();

    const bid = booking._id.toString();
    for (const uid of [booking.requesterId.toString(), booking.travelerId.toString()]) {
      this.notify(
        this.notificationsService.createNotification({
          userId: uid,
          type: 'dispute_raised',
          title: 'Dispute raised',
          body: 'A dispute has been raised on your booking.',
          metadata: { bookingId: bid },
        }),
      );
    }

    return booking;
  }

  async cancelBooking(
    userId: string,
    bookingId: string,
    dto: CancelBookingDto,
  ): Promise<{ message: string }> {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    const uid = booking.requesterId.toString();
    const tid = booking.travelerId.toString();
    if (userId !== uid && userId !== tid) {
      throw new ForbiddenException('Only parties on the booking can cancel');
    }

    const cancellable: BookingStatus[] = [
      'pending_acceptance',
      'countered',
      'confirmed',
    ];
    if (!cancellable.includes(booking.status)) {
      throw new BadRequestException('Booking cannot be cancelled in its current state');
    }

    booking.status = 'cancelled';
    booking.cancelledBy = new Types.ObjectId(userId);
    booking.cancelledAt = new Date();
    booking.cancellationReason = dto.reason;

    await booking.save();

    await this.revertMatch(booking);

    const bid = booking._id.toString();
    const otherUserId =
      userId === booking.requesterId.toString()
        ? booking.travelerId.toString()
        : booking.requesterId.toString();
    this.notify(
      this.notificationsService.createNotification({
        userId: otherUserId,
        type: 'booking_cancelled',
        title: 'Booking cancelled',
        body: 'A booking has been cancelled.',
        metadata: { bookingId: bid },
      }),
    );

    return { message: 'Booking cancelled' };
  }

  async findMyBookings(
    userId: string,
    query: {
      status?: BookingStatus;
      role?: 'requester' | 'traveler';
      page?: number;
      limit?: number;
    },
  ): Promise<{
    data: BookingDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const filter: Record<string, unknown> = {};
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 10));
    const skip = (page - 1) * limit;

    if (query.role === 'requester') {
      filter.requesterId = new Types.ObjectId(userId);
    } else if (query.role === 'traveler') {
      filter.travelerId = new Types.ObjectId(userId);
    } else {
      filter.$or = [
        { requesterId: new Types.ObjectId(userId) },
        { travelerId: new Types.ObjectId(userId) },
      ];
    }
    if (query.status) {
      filter.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.bookingModel
        .find(filter)
        .populate([...POPULATE_MY_BOOKINGS])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.bookingModel.countDocuments(filter).exec(),
    ]);

    return {
      data: data as unknown as BookingDocument[],
      total,
      page,
      limit,
    };
  }

  async findOneForParty(
    bookingId: string,
    userId: string,
  ): Promise<BookingDocument> {
    if (!Types.ObjectId.isValid(bookingId)) {
      throw new NotFoundException('Booking not found');
    }
    const booking = await this.bookingModel
      .findById(bookingId)
      .populate([...POPULATE_MY_BOOKINGS])
      .exec();
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    const uid = booking.requesterId.toString();
    const tid = booking.travelerId.toString();
    if (userId !== uid && userId !== tid) {
      throw new ForbiddenException('You do not have access to this booking');
    }
    return booking;
  }
}
