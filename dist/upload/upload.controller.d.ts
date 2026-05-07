import type { RequestUser } from '../auth/strategies/jwt-access.strategy';
import { UploadService } from './upload.service';
import { UsersService } from '../users/users.service';
import { BookingsService } from '../bookings/bookings.service';
export declare class UploadController {
    private readonly uploadService;
    private readonly usersService;
    private readonly bookingsService;
    constructor(uploadService: UploadService, usersService: UsersService, bookingsService: BookingsService);
    uploadAvatar(user: RequestUser, file: Express.Multer.File): Promise<{
        url: string;
    }>;
    uploadDelivery(user: RequestUser, bookingId: string, file: Express.Multer.File): Promise<{
        url: string;
    }>;
    uploadItem(_user: RequestUser, file: Express.Multer.File): Promise<{
        url: string;
    }>;
    uploadChat(user: RequestUser, bookingId: string, file: Express.Multer.File): Promise<{
        url: string;
    }>;
}
