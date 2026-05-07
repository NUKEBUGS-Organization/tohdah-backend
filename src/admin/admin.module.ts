import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { TripsModule } from '../trips/trips.module';
import { RequestsModule } from '../requests/requests.module';
import { BookingsModule } from '../bookings/bookings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { SuperAdminGuard } from '../auth/guards/superadmin.guard';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    TripsModule,
    RequestsModule,
    BookingsModule,
    NotificationsModule,
    PaymentsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard, SuperAdminGuard],
})
export class AdminModule {}
