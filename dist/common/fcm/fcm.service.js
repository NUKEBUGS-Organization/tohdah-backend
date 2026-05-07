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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FcmService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FcmService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const admin = __importStar(require("firebase-admin"));
const fs_1 = require("fs");
const path_1 = require("path");
function firebaseErrorCode(err) {
    if (err && typeof err === 'object' && 'code' in err) {
        const c = err.code;
        return typeof c === 'string' ? c : undefined;
    }
    return undefined;
}
function firebaseErrorMessage(err) {
    if (err && typeof err === 'object' && 'message' in err) {
        const m = err.message;
        if (typeof m === 'string')
            return m;
    }
    return String(err);
}
let FcmService = FcmService_1 = class FcmService {
    config;
    logger = new common_1.Logger(FcmService_1.name);
    app;
    constructor(config) {
        this.config = config;
        const serviceAccountPath = (0, path_1.resolve)(this.config.get('FIREBASE_SERVICE_ACCOUNT_PATH', './firebase-service-account.json'));
        try {
            const serviceAccount = JSON.parse((0, fs_1.readFileSync)(serviceAccountPath, 'utf8'));
            if (!admin.apps.length) {
                this.app = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
            }
            else {
                this.app = admin.app();
            }
        }
        catch (err) {
            this.logger.warn('Firebase service account not found or invalid. ' +
                'Push notifications will be disabled. ' +
                `Path: ${serviceAccountPath} (${firebaseErrorMessage(err)})`);
        }
    }
    async sendToDevice(params) {
        if (!this.app)
            return false;
        try {
            await admin.messaging(this.app).send({
                token: params.token,
                notification: {
                    title: params.title,
                    body: params.body,
                    ...(params.imageUrl ? { imageUrl: params.imageUrl } : {}),
                },
                data: params.data ?? {},
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1,
                        },
                    },
                },
                android: {
                    notification: {
                        sound: 'default',
                        priority: 'high',
                    },
                },
                webpush: {
                    notification: {
                        icon: '/favicon.svg',
                        badge: '/favicon.svg',
                    },
                },
            });
            return true;
        }
        catch (err) {
            const code = firebaseErrorCode(err);
            if (code === 'messaging/registration-token-not-registered' ||
                code === 'messaging/invalid-registration-token') {
                this.logger.warn(`Invalid FCM token — should be removed: ${code}`);
                return false;
            }
            this.logger.error(`FCM send failed: ${firebaseErrorMessage(err)}`);
            return false;
        }
    }
    async sendToMultiple(params) {
        if (!this.app || !params.tokens.length) {
            return { successCount: 0, failedTokens: [] };
        }
        const results = await Promise.allSettled(params.tokens.map((token) => this.sendToDevice({
            token,
            title: params.title,
            body: params.body,
            data: params.data,
        })));
        const failedTokens = [];
        let successCount = 0;
        results.forEach((result, i) => {
            if (result.status === 'fulfilled' && result.value) {
                successCount++;
            }
            else {
                failedTokens.push(params.tokens[i]);
            }
        });
        return { successCount, failedTokens };
    }
    async sendToTopic(params) {
        if (!this.app)
            return false;
        try {
            await admin.messaging(this.app).send({
                topic: params.topic,
                notification: { title: params.title, body: params.body },
                data: params.data ?? {},
            });
            return true;
        }
        catch (err) {
            this.logger.error(`FCM topic send failed: ${firebaseErrorMessage(err)}`);
            return false;
        }
    }
    isAvailable() {
        return !!this.app;
    }
};
exports.FcmService = FcmService;
exports.FcmService = FcmService = FcmService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FcmService);
//# sourceMappingURL=fcm.service.js.map