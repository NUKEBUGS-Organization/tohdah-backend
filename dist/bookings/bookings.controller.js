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
exports.BookingsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const bookings_service_1 = require("./bookings.service");
const create_booking_dto_1 = require("./dto/create-booking.dto");
const counter_offer_dto_1 = require("./dto/counter-offer.dto");
const proof_of_delivery_dto_1 = require("./dto/proof-of-delivery.dto");
const dispute_dto_1 = require("./dto/dispute.dto");
const cancel_booking_dto_1 = require("./dto/cancel-booking.dto");
const pay_booking_dto_1 = require("./dto/pay-booking.dto");
const get_my_bookings_query_dto_1 = require("./dto/get-my-bookings-query.dto");
let BookingsController = class BookingsController {
    bookingsService;
    constructor(bookingsService) {
        this.bookingsService = bookingsService;
    }
    createMatch(user, dto) {
        return this.bookingsService.createMatch(user.userId, dto);
    }
    getMy(user, query) {
        return this.bookingsService.findMyBookings(user.userId, {
            status: query.status,
            role: query.role,
            page: query.page,
            limit: query.limit,
        });
    }
    findOne(user, id) {
        return this.bookingsService.findOneForParty(id, user.userId);
    }
    accept(user, id) {
        return this.bookingsService.acceptBooking(user.userId, id);
    }
    counter(user, id, dto) {
        return this.bookingsService.counterOffer(user.userId, id, dto);
    }
    decline(user, id) {
        return this.bookingsService.declineBooking(user.userId, id);
    }
    acceptCounter(user, id) {
        return this.bookingsService.acceptCounter(user.userId, id);
    }
    pay(user, id, dto) {
        return this.bookingsService.pay(user.userId, id, dto);
    }
    inTransit(user, id) {
        return this.bookingsService.markInTransit(user.userId, id);
    }
    proofOfDelivery(user, id, dto) {
        return this.bookingsService.submitProofOfDelivery(user.userId, id, dto);
    }
    complete(user, id) {
        return this.bookingsService.completeBooking(user.userId, id);
    }
    dispute(user, id, dto) {
        return this.bookingsService.raiseDispute(user.userId, id, dto);
    }
    cancel(user, id, dto) {
        return this.bookingsService.cancelBooking(user.userId, id, dto);
    }
};
exports.BookingsController = BookingsController;
__decorate([
    (0, common_1.Post)('match'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_booking_dto_1.CreateBookingDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "createMatch", null);
__decorate([
    (0, common_1.Get)('my'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, get_my_bookings_query_dto_1.GetMyBookingsQueryDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "getMy", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/accept'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "accept", null);
__decorate([
    (0, common_1.Post)(':id/counter'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, counter_offer_dto_1.CounterOfferDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "counter", null);
__decorate([
    (0, common_1.Post)(':id/decline'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "decline", null);
__decorate([
    (0, common_1.Post)(':id/accept-counter'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "acceptCounter", null);
__decorate([
    (0, common_1.Post)(':id/pay'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, pay_booking_dto_1.PayBookingDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "pay", null);
__decorate([
    (0, common_1.Post)(':id/in-transit'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "inTransit", null);
__decorate([
    (0, common_1.Post)(':id/proof-of-delivery'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, proof_of_delivery_dto_1.ProofOfDeliveryDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "proofOfDelivery", null);
__decorate([
    (0, common_1.Post)(':id/complete'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "complete", null);
__decorate([
    (0, common_1.Post)(':id/dispute'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dispute_dto_1.DisputeDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "dispute", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, cancel_booking_dto_1.CancelBookingDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "cancel", null);
exports.BookingsController = BookingsController = __decorate([
    (0, common_1.Controller)('bookings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [bookings_service_1.BookingsService])
], BookingsController);
//# sourceMappingURL=bookings.controller.js.map