/**
 * Seeds a default admin user if none exists with email admin@tohdah.com.
 *
 * Usage (from repo root, `tohdah-backend/`):
 *   npx ts-node src/scripts/seed-admin.ts
 *   npx ts-node -r tsconfig-paths/register src/scripts/seed-admin.ts
 *
 * IMPORTANT: Change the password and email immediately in production.
 */

import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { User, UserSchema } from '../users/schemas/user.schema';

const SALT_ROUNDS = 10;
const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

async function uniqueReferralCode(
  UserModel: mongoose.Model<{ referralCode?: string }>,
): Promise<string> {
  for (let i = 0; i < 8; i++) {
    let code = '';
    for (let j = 0; j < 8; j++) {
      code += REF_CHARS[randomInt(REF_CHARS.length)];
    }
    const exists = await UserModel.exists({ referralCode: code });
    if (!exists) return code;
  }
  throw new Error('Could not generate referral code');
}

const logger = new Logger('SeedAdmin');

async function main() {
  const uri =
    process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/tohdah';

  await mongoose.connect(uri);

  const UserModel = mongoose.model(User.name, UserSchema);

  const existing = await UserModel.findOne({
    email: 'admin@tohdah.com',
  }).exec();

  if (existing) {
    logger.log('Admin user already exists (admin@tohdah.com). Skipping.');
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash('AdminTohdah2025!', SALT_ROUNDS);
  const referralCode = await uniqueReferralCode(UserModel);

  await UserModel.create({
    fullName: 'Tohdah Admin',
    email: 'admin@tohdah.com',
    phoneNumber: '+10000000000',
    passwordHash,
    authProvider: 'local',
    role: 'admin',
    isEmailVerified: true,
    referralCode,
  });

  logger.log(
    'Created admin user admin@tohdah.com — change credentials before production.',
  );
  await mongoose.disconnect();
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  logger.error(msg);
  process.exit(1);
});
