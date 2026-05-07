import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UserReport, UserReportSchema } from './schemas/user-report.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { Trip, TripSchema } from '../trips/schemas/trip.schema';
import {
  Request as RequestEntity,
  RequestSchema,
} from '../requests/schemas/request.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserReport.name, schema: UserReportSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Trip.name, schema: TripSchema },
      { name: RequestEntity.name, schema: RequestSchema },
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
