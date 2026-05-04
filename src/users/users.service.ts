import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async create(data: {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
  }): Promise<UserDocument> {
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const created = new this.userModel({
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      passwordHash,
    });
    return created.save();
  }
}
