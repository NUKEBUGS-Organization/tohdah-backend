"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const user_schema_1 = require("../users/schemas/user.schema");
const SALT_ROUNDS = 10;
const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
async function uniqueReferralCode(UserModel) {
    for (let i = 0; i < 8; i++) {
        let code = '';
        for (let j = 0; j < 8; j++) {
            code += REF_CHARS[(0, crypto_1.randomInt)(REF_CHARS.length)];
        }
        const exists = await UserModel.exists({ referralCode: code });
        if (!exists)
            return code;
    }
    throw new Error('Could not generate referral code');
}
const logger = new common_1.Logger('SeedAdmin');
async function main() {
    const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/tohdah';
    await mongoose_1.default.connect(uri);
    const UserModel = mongoose_1.default.model(user_schema_1.User.name, user_schema_1.UserSchema);
    const existing = await UserModel.findOne({
        email: 'admin@tohdah.com',
    }).exec();
    if (existing) {
        logger.log('Admin user already exists (admin@tohdah.com). Skipping.');
        await mongoose_1.default.disconnect();
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
    logger.log('Created admin user admin@tohdah.com — change credentials before production.');
    await mongoose_1.default.disconnect();
}
main().catch((err) => {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(msg);
    process.exit(1);
});
//# sourceMappingURL=seed-admin.js.map