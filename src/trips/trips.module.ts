import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Trip, TripSchema } from './schemas/trip.schema';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Trip.name, schema: TripSchema }]),
    AuthModule,
  ],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService, MongooseModule],
})
export class TripsModule {}
