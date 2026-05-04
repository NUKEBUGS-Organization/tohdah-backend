import { Model } from 'mongoose';
import { UserDocument } from './schemas/user.schema';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    findByEmail(email: string): Promise<UserDocument | null>;
    create(data: {
        fullName: string;
        email: string;
        phoneNumber: string;
        password: string;
    }): Promise<UserDocument>;
}
