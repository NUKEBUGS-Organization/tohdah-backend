import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SkipAllThrottlers } from '../common/decorators/throttle.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';
import { SuperAdminGuard } from '../auth/guards/superadmin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/strategies/jwt-access.strategy';
import { AdminService } from './admin.service';
import { BanUserDto, SuspendUserDto } from './dto/suspend-ban.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { ApproveSupportDto, RejectSupportDto } from './dto/support-notes.dto';

function optInt(v?: string): number | undefined {
  if (v === undefined || v === '') return undefined;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? undefined : n;
}

function optBool(v?: string): boolean | undefined {
  if (v === 'true') return true;
  if (v === 'false') return false;
  return undefined;
}

@SkipAllThrottlers()
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('users')
  listUsers(@Query() q: Record<string, string | undefined>) {
    return this.adminService.listUsers({
      search: q.search,
      role: q.role,
      accountType: q.accountType,
      status: q.status,
      isVerified: optBool(q.isVerified),
      dateFrom: q.dateFrom,
      dateTo: q.dateTo,
      page: optInt(q.page),
      limit: optInt(q.limit),
    });
  }

  @Get('trips')
  listTrips(@Query() q: Record<string, string | undefined>) {
    return this.adminService.listTrips({
      status: q.status,
      origin: q.origin,
      destination: q.destination,
      dateFrom: q.dateFrom,
      dateTo: q.dateTo,
      travelerId: q.travelerId,
      page: optInt(q.page),
      limit: optInt(q.limit),
    });
  }

  @Get('requests')
  listRequests(@Query() q: Record<string, string | undefined>) {
    return this.adminService.listRequests({
      status: q.status,
      type: q.type,
      urgencyLevel: q.urgencyLevel,
      origin: q.origin,
      destination: q.destination,
      requesterId: q.requesterId,
      page: optInt(q.page),
      limit: optInt(q.limit),
    });
  }

  @Get('bookings')
  listBookings(@Query() q: Record<string, string | undefined>) {
    return this.adminService.listBookings({
      status: q.status,
      travelerId: q.travelerId,
      requesterId: q.requesterId,
      dateFrom: q.dateFrom,
      dateTo: q.dateTo,
      page: optInt(q.page),
      limit: optInt(q.limit),
    });
  }

  @Get('disputes')
  listDisputes(@Query() q: Record<string, string | undefined>) {
    return this.adminService.listDisputes({
      dateFrom: q.dateFrom,
      dateTo: q.dateTo,
      page: optInt(q.page),
      limit: optInt(q.limit),
    });
  }

  @Post('disputes/:bookingId/resolve')
  resolveDispute(
    @CurrentUser() admin: RequestUser,
    @Param('bookingId') bookingId: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.adminService.resolveDispute(admin.userId, bookingId, dto);
  }

  @Get('support-requests')
  listSupportRequests(@Query() q: Record<string, string | undefined>) {
    return this.adminService.listSupportRequests({
      adminApprovalStatus: q.adminApprovalStatus,
      urgencyLevel: q.urgencyLevel,
      status: q.status,
      page: optInt(q.page),
      limit: optInt(q.limit),
    });
  }

  @Post('support-requests/:requestId/approve')
  approveSupport(
    @CurrentUser() admin: RequestUser,
    @Param('requestId') requestId: string,
    @Body() dto: ApproveSupportDto,
  ) {
    return this.adminService.approveSupportRequest(
      admin.userId,
      requestId,
      dto.notes,
    );
  }

  @Post('support-requests/:requestId/reject')
  rejectSupport(
    @CurrentUser() admin: RequestUser,
    @Param('requestId') requestId: string,
    @Body() dto: RejectSupportDto,
  ) {
    return this.adminService.rejectSupportRequest(
      admin.userId,
      requestId,
      dto.notes,
    );
  }

  @Get('impact')
  getImpact(@Query() q: Record<string, string | undefined>) {
    return this.adminService.getImpact({
      dateFrom: q.dateFrom,
      dateTo: q.dateTo,
    });
  }

  @Get('referrals')
  listReferrals(@Query() q: Record<string, string | undefined>) {
    return this.adminService.listReferrals({
      page: optInt(q.page),
      limit: optInt(q.limit),
    });
  }

  @Get('loyalty')
  loyalty() {
    return this.adminService.getLoyaltyOverview();
  }

  @Patch('users/:userId/suspend')
  suspend(
    @CurrentUser() _admin: RequestUser,
    @Param('userId') userId: string,
    @Body() dto: SuspendUserDto,
  ) {
    return this.adminService.suspendUser(_admin.userId, userId, dto.reason);
  }

  @Patch('users/:userId/ban')
  ban(
    @CurrentUser() _admin: RequestUser,
    @Param('userId') userId: string,
    @Body() dto: BanUserDto,
  ) {
    return this.adminService.banUser(_admin.userId, userId, dto.reason);
  }

  @Patch('users/:userId/reinstate')
  reinstate(
    @CurrentUser() admin: RequestUser,
    @Param('userId') userId: string,
  ) {
    return this.adminService.reinstateUser(admin.userId, userId);
  }

  @Patch('users/:userId/role')
  @UseGuards(SuperAdminGuard)
  updateRole(
    @CurrentUser() admin: RequestUser,
    @Param('userId') userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(admin.userId, userId, dto.role);
  }

  @Get('users/:userId')
  getUser(@Param('userId') userId: string) {
    return this.adminService.getUserDetail(userId);
  }
}
