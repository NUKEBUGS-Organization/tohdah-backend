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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const bookings_service_1 = require("../bookings/bookings.service");
const throttle_decorator_1 = require("../common/decorators/throttle.decorator");
const payments_service_1 = require("./payments.service");
let PaymentsController = class PaymentsController {
    paymentsService;
    bookingsService;
    config;
    constructor(paymentsService, bookingsService, config) {
        this.paymentsService = paymentsService;
        this.bookingsService = bookingsService;
        this.config = config;
    }
    async createIntent(bookingId, user) {
        const booking = await this.bookingsService.findOneForParty(bookingId, user.userId);
        if (booking.status !== 'confirmed') {
            throw new common_1.BadRequestException('Booking must be confirmed before payment');
        }
        if (booking.requesterId.toString() !== user.userId) {
            throw new common_1.ForbiddenException('Only the requester can initiate payment');
        }
        const fee = booking.agreedFee ?? booking.counterFee ?? booking.offeredFee;
        const currency = booking.currency ??
            this.config.get('STRIPE_CURRENCY', 'usd') ??
            'usd';
        return this.paymentsService.createPaymentIntent({
            amount: fee,
            currency,
            bookingId: booking._id.toString(),
            requesterId: user.userId,
        });
    }
    async handleWebhook(req, signature) {
        if (!signature) {
            throw new common_1.BadRequestException('Missing stripe-signature header');
        }
        const raw = req.rawBody;
        if (!raw) {
            throw new common_1.BadRequestException('Missing raw body');
        }
        let event;
        try {
            event = this.paymentsService.constructWebhookEvent(raw, signature);
        }
        catch {
            throw new common_1.BadRequestException('Invalid webhook signature');
        }
        if (event.type === 'payment_intent.succeeded') {
            const intent = event.data.object;
            const bookingId = await this.paymentsService.handlePaymentSuccess(intent.id);
            await this.bookingsService.markAsPaidFromWebhook(bookingId, intent.id);
        }
        return { received: true };
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('intent/:bookingId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('bookingId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createIntent", null);
__decorate([
    (0, common_1.Post)('webhook'),
    (0, throttle_decorator_1.SkipAllThrottlers)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('stripe-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "handleWebhook", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService,
        bookings_service_1.BookingsService,
        config_1.ConfigService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map