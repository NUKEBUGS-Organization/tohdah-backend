import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { UserDocument } from '../users/schemas/user.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import {
  Request as RequestEntity,
  RequestDocument,
} from '../requests/schemas/request.schema';
import { UsersService } from '../users/users.service';
import type { TrustBreakdown, TrustLine, TrustResult } from './trust.types';

@Injectable()
export class TrustService {
  constructor(
    private readonly usersService: UsersService,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(RequestEntity.name)
    private readonly requestModel: Model<RequestDocument>,
  ) {}

  private line(earned: boolean, pts: number): TrustLine {
    return { earned, points: earned ? pts : 0 };
  }

  /** Pure scoring from user + activity counts — used internally and tests. */
  calculateTrustScore(
    user: UserDocument,
    completedBookings: number,
    supportDeliveries: number,
  ): TrustResult {
    let raw = 0;

    const emailVerified = !!user.isEmailVerified;
    const emailPts = 15;
    if (emailVerified) raw += emailPts;

    const phoneVerified = !!user.isPhoneVerified;
    const phonePts = 15;
    if (phoneVerified) raw += phonePts;

    const idVerified = !!user.isIdVerified;
    const idPts = 25;
    if (idVerified) raw += idPts;

    const selfieVerified = !!user.isSelfieVerified;
    const selfiePts = 10;
    if (selfieVerified) raw += selfiePts;

    const hasPhoto =
      !!(user.profilePhoto && String(user.profilePhoto).trim().length > 0);
    const hasBio = !!(user.bio && String(user.bio).trim().length > 0);
    const photoPts = hasPhoto ? 5 : 0;
    const bioPts = hasBio ? 5 : 0;
    raw += photoPts + bioPts;
    const profileEarned = hasPhoto || hasBio;
    const profilePoints = photoPts + bioPts;

    const ratingVal = Number(user.rating ?? 0);
    const rc = Number(user.reviewCount ?? 0);
    let ratingPoints = 0;
    if (ratingVal >= 4.0 && rc >= 3) {
      ratingPoints = 15;
    } else if (ratingVal >= 3.0 && rc >= 1) {
      ratingPoints = 10;
    }
    raw += ratingPoints;

    const completedPts = completedBookings >= 5 ? 10 : 0;
    raw += completedPts;

    const supportPts = supportDeliveries >= 1 ? 5 : 0;
    raw += supportPts;

    const score = Math.min(100, Math.round(raw));

    const breakdown: TrustBreakdown = {
      emailVerified: this.line(emailVerified, emailPts),
      phoneVerified: this.line(phoneVerified, phonePts),
      idVerified: this.line(idVerified, idPts),
      selfieVerified: this.line(selfieVerified, selfiePts),
      profileComplete: this.line(profileEarned, profilePoints),
      ratingScore: { points: ratingPoints },
      completedBookings: { count: completedBookings, points: completedPts },
      supportDeliveries: { count: supportDeliveries, points: supportPts },
    };

    return { score, breakdown };
  }

  private requestCollection(): string {
    return this.requestModel.collection.name;
  }

  async countCompletedParticipantBookings(userId: string): Promise<number> {
    const oid = new Types.ObjectId(userId);
    return this.bookingModel.countDocuments({
      status: 'completed',
      $or: [{ requesterId: oid }, { travelerId: oid }],
    });
  }

  async countCompletedSupportDeliveries(travelerId: string): Promise<number> {
    const oid = new Types.ObjectId(travelerId);
    const rows = await this.bookingModel
      .aggregate<{ n: number }>([
        { $match: { travelerId: oid, status: 'completed' } },
        {
          $lookup: {
            from: this.requestCollection(),
            localField: 'requestId',
            foreignField: '_id',
            as: 'rq',
          },
        },
        { $unwind: '$rq' },
        { $match: { 'rq.type': 'support' } },
        { $count: 'n' },
      ])
      .exec();
    return rows[0]?.n ?? 0;
  }

  async getTrustResult(userId: string): Promise<TrustResult> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const completed = await this.countCompletedParticipantBookings(userId);
    const supportDel = await this.countCompletedSupportDeliveries(userId);
    return this.calculateTrustScore(user, completed, supportDel);
  }

  /**
   * Stub: toggles verification flags directly. In production this should be set
   * by KYC / email-provider webhooks rather than client-callable PATCH.
   */
  async verifyFieldStub(
    userId: string,
    field: 'email' | 'phone' | 'id' | 'selfie',
  ): Promise<TrustResult> {
    const updated = await this.usersService.setVerificationFlag(userId, field);
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return this.getTrustResult(userId);
  }

  async getBadges(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const completed = await this.countCompletedParticipantBookings(userId);
    const supportDeliveries =
      await this.countCompletedSupportDeliveries(userId);
    const rating = Number(user.rating ?? 0);

    return [
      {
        badge: 'email_verified',
        earned: !!user.isEmailVerified,
      },
      {
        badge: 'phone_verified',
        earned: !!user.isPhoneVerified,
      },
      {
        badge: 'id_verified',
        earned: !!user.isIdVerified,
      },
      {
        badge: 'selfie_verified',
        earned: !!user.isSelfieVerified,
      },
      {
        badge: 'top_rated',
        earned: rating >= 4.5,
      },
      {
        badge: 'experienced',
        earned: completed >= 10,
      },
      {
        badge: 'community_champion',
        earned: supportDeliveries >= 5,
      },
    ];
  }
}
