import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AdminService } from './admin.service';
import type { ResolveDisputeDto } from './dto/resolve-dispute.dto';

describe('AdminService', () => {
  const adminOid = new Types.ObjectId().toString();

  let service: AdminService;
  let userModel: {
    countDocuments: jest.Mock;
    aggregate: jest.Mock;
    find: jest.Mock;
  };
  let bookingModel: {
    countDocuments: jest.Mock;
    aggregate: jest.Mock;
    find: jest.Mock;
    findById: jest.Mock;
  };
  let tripModel: { countDocuments: jest.Mock };
  let requestModel: {
    countDocuments: jest.Mock;
    aggregate: jest.Mock;
    findById: jest.Mock;
  };
  let usersService: {
    findById: jest.Mock;
    getStats: jest.Mock;
    updateRefreshTokenHash: jest.Mock;
  };
  let redisService: { deleteAllRefreshTokens: jest.Mock };
  let notificationsService: {
    createNotification: jest.Mock;
  };
  let paymentsService: { refundPayment: jest.Mock };

  beforeEach(() => {
    userModel = {
      countDocuments: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      }),
      aggregate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
      find: jest.fn(),
    };
    bookingModel = {
      countDocuments: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      }),
      aggregate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
      find: jest.fn(),
      findById: jest.fn(),
    };
    tripModel = {
      countDocuments: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      }),
    };
    requestModel = {
      collection: { name: 'requests' },
      countDocuments: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      }),
      aggregate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
      findById: jest.fn(),
    };
    usersService = {
      findById: jest.fn(),
      getStats: jest.fn(),
      updateRefreshTokenHash: jest.fn(),
    };
    notificationsService = {
      createNotification: jest.fn().mockResolvedValue({}),
    };
    paymentsService = {
      refundPayment: jest.fn().mockResolvedValue(undefined),
    };
    redisService = {
      deleteAllRefreshTokens: jest.fn().mockResolvedValue(undefined),
    };

    service = new AdminService(
      userModel as never,
      bookingModel as never,
      tripModel as never,
      requestModel as never,
      usersService as never,
      notificationsService as never,
      paymentsService as never,
      redisService as never,
    );
  });

  it('getPlatformStats returns correct shape with all keys', async () => {
    const stats = await service.getPlatformStats();

    expect(stats).toEqual({
      users: {
        total: 0,
        newToday: 0,
        newThisWeek: 0,
        travelers: 0,
        requesters: 0,
        verified: 0,
      },
      trips: {
        total: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
      },
      requests: {
        total: 0,
        pending: 0,
        standard: 0,
        support: 0,
        completed: 0,
      },
      bookings: {
        total: 0,
        active: 0,
        completed: 0,
        disputed: 0,
        cancelled: 0,
      },
      revenue: {
        totalCommission: 0,
        thisMonth: 0,
        thisWeek: 0,
      },
      impact: {
        supportRequestsTotal: 0,
        supportRequestsFulfilled: 0,
        volunteerDeliveries: 0,
        elderlyAssisted: 0,
        communityChampions: 0,
      },
    });
  });

  it('suspendUser sets accountStatus suspended', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const oid = new Types.ObjectId();
    const target = {
      _id: oid,
      role: 'user',
      accountStatus: 'active',
      save,
    };
    usersService.findById.mockResolvedValue(target);

    await service.suspendUser(adminOid, oid.toString(), 'spam');

    expect(save).toHaveBeenCalled();
    expect(target.accountStatus).toBe('suspended');
    expect(target.suspensionReason).toBe('spam');
    expect(target.suspendedAt).toBeInstanceOf(Date);
  });

  it('suspendUser throws when target is admin', async () => {
    usersService.findById.mockResolvedValue({
      role: 'admin',
      accountStatus: 'active',
    });

    await expect(
      service.suspendUser('a', new Types.ObjectId().toString(), 'x'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('banUser revokes all Redis refresh sessions', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const uid = new Types.ObjectId().toString();
    usersService.findById.mockResolvedValue({
      _id: uid,
      role: 'user',
      accountStatus: 'active',
      save,
    });

    await service.banUser(adminOid, uid, 'fraud');

    expect(redisService.deleteAllRefreshTokens).toHaveBeenCalledWith(uid);
  });

  it('resolveDispute refund_requester sets cancelled and refundAmount', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const booking = {
      status: 'disputed',
      agreedFee: 40,
      offeredFee: 25,
      paymentIntentId: 'pi_test_1',
      save,
    };
    bookingModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(booking),
    });

    const dto: ResolveDisputeDto = {
      resolution: 'refund_requester',
      notes: 'Full refund',
    };

    await service.resolveDispute(adminOid, 'booking-id', dto);

    expect(booking.status).toBe('cancelled');
    expect(booking.refundAmount).toBe(40);
    expect(booking.disputeResolution).toBe('Full refund');
    expect(save).toHaveBeenCalled();
    expect(paymentsService.refundPayment).toHaveBeenCalledWith({
      paymentIntentId: 'pi_test_1',
      amount: undefined,
    });
  });

  it('resolveDispute release_traveler sets completed', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const booking = {
      status: 'disputed',
      save,
    };
    bookingModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(booking),
    });

    await service.resolveDispute(adminOid, 'bid', {
      resolution: 'release_traveler',
      notes: 'ok',
    });

    expect(booking.status).toBe('completed');
    expect(save).toHaveBeenCalled();
  });

  it('approveSupport sets adminApprovalStatus and notifies', async () => {
    const rid = new Types.ObjectId();
    const save = jest.fn().mockResolvedValue(undefined);
    const doc = {
      type: 'support',
      requesterId: rid,
      save,
    };
    requestModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(doc),
    });

    await service.approveSupportRequest(adminOid, 'req-id', 'OK');

    expect(doc.adminApprovalStatus).toBe('approved');
    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'support_request_approved',
        metadata: { requestId: 'req-id' },
      }),
    );
  });

  it('rejectSupport sets status cancelled', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const doc = {
      type: 'support',
      status: 'pending',
      save,
    };
    requestModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(doc),
    });

    await service.rejectSupportRequest(adminOid, 'req-id', 'bad');

    expect(doc.adminApprovalStatus).toBe('rejected');
    expect(doc.status).toBe('cancelled');
  });
});
