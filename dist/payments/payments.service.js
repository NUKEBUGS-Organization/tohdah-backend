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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = __importDefault(require("stripe"));
let PaymentsService = class PaymentsService {
    config;
    stripeClient = null;
    constructor(config) {
        this.config = config;
    }
    getStripe() {
        const secret = this.config.get('STRIPE_SECRET_KEY')?.trim();
        if (!secret) {
            throw new common_1.BadRequestException('Stripe is not configured');
        }
        if (!this.stripeClient) {
            this.stripeClient = new stripe_1.default(secret, { typescript: true });
        }
        return this.stripeClient;
    }
    async createPaymentIntent(params) {
        const stripe = this.getStripe();
        const intent = await stripe.paymentIntents.create({
            amount: Math.round(params.amount * 100),
            currency: params.currency.toLowerCase(),
            metadata: {
                bookingId: params.bookingId,
                requesterId: params.requesterId,
            },
        });
        return {
            clientSecret: intent.client_secret,
            paymentIntentId: intent.id,
        };
    }
    async handlePaymentSuccess(paymentIntentId) {
        const stripe = this.getStripe();
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
        const bookingId = intent.metadata?.bookingId;
        if (!bookingId) {
            throw new Error('PaymentIntent missing bookingId metadata');
        }
        return bookingId;
    }
    async refundPayment(params) {
        const stripe = this.getStripe();
        await stripe.refunds.create({
            payment_intent: params.paymentIntentId,
            ...(params.amount !== undefined && params.amount !== null
                ? { amount: Math.round(params.amount * 100) }
                : {}),
        });
    }
    constructWebhookEvent(payload, signature) {
        const stripe = this.getStripe();
        const secret = this.config.getOrThrow('STRIPE_WEBHOOK_SECRET');
        return stripe.webhooks.constructEvent(payload, signature, secret);
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map