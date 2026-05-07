import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { TripsModule } from '../trips/trips.module';
import { Request, RequestSchema } from './schemas/request.schema';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Request.name, schema: RequestSchema }]),
    AuthModule,
    TripsModule,
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
  exports: [RequestsService, MongooseModule],
})
export class RequestsModule {}
