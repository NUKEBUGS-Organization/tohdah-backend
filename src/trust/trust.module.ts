import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { BookingsModule } from '../bookings/bookings.module';
import { RequestsModule } from '../requests/requests.module';
import { UsersModule } from '../users/users.module';
import { TrustController } from './trust.controller';
import { TrustService } from './trust.service';

@Module({
  imports: [AuthModule, UsersModule, BookingsModule, RequestsModule],
  controllers: [TrustController],
  providers: [TrustService],
})
export class TrustModule {}
