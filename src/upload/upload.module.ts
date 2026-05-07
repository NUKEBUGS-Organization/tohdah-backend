import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { BookingsModule } from '../bookings/bookings.module';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';

@Module({
  imports: [AuthModule, UsersModule, BookingsModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
