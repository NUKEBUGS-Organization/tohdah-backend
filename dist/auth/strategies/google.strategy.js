"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleStrategy = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const passport_1 = require("@nestjs/passport");
const passport_google_oauth20_1 = require("passport-google-oauth20");
const auth_service_1 = require("../auth.service");
let GoogleStrategy = class GoogleStrategy extends (0, passport_1.PassportStrategy)(passport_google_oauth20_1.Strategy, 'google') {
    config;
    authService;
    constructor(config, authService) {
        super({
            clientID: config.getOrThrow('GOOGLE_CLIENT_ID'),
            clientSecret: config.getOrThrow('GOOGLE_CLIENT_SECRET'),
            callbackURL: config.getOrThrow('GOOGLE_CALLBACK_URL'),
            scope: ['email', 'profile'],
        });
        this.config = config;
        this.authService = authService;
    }
    async validate(_accessToken, _refreshToken, profile) {
        const email = profile.emails?.[0]?.value?.trim().toLowerCase();
        if (!email) {
            throw new common_1.UnauthorizedException('No email returned from Google');
        }
        const photo = profile.photos?.[0]?.value ?? null;
        const fullName = profile.displayName?.trim() || email.split('@')[0] || 'User';
        return this.authService.findOrCreateGoogleUser({
            googleId: profile.id,
            email,
            fullName,
            profilePhoto: photo,
        });
    }
};
exports.GoogleStrategy = GoogleStrategy;
exports.GoogleStrategy = GoogleStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        auth_service_1.AuthService])
], GoogleStrategy);
//# sourceMappingURL=google.strategy.js.map