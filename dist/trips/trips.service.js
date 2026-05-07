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
exports.TripsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const trip_schema_1 = require("./schemas/trip.schema");
function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
let TripsService = class TripsService {
    tripModel;
    constructor(tripModel) {
        this.tripModel = tripModel;
    }
    assertDateOrder(departure, arrival) {
        if (arrival <= departure) {
            throw new common_1.BadRequestException('arrivalDate must be after departureDate');
        }
    }
    assertPricing(pricingType, pricePerKg) {
        if (pricingType === 'fixed' && (pricePerKg === undefined || pricePerKg === null)) {
            throw new common_1.BadRequestException('pricePerKg is required when pricingType is fixed');
        }
    }
    async create(travelerId, dto) {
        const departureDate = new Date(dto.departureDate);
        const arrivalDate = new Date(dto.arrivalDate);
        this.assertDateOrder(departureDate, arrivalDate);
        this.assertPricing(dto.pricingType, dto.pricePerKg);
        const trip = await this.tripModel.create({
            travelerId: new mongoose_2.Types.ObjectId(travelerId),
            origin: dto.origin.trim(),
            destination: dto.destination.trim(),
            departureDate,
            arrivalDate,
            luggageSpace: dto.luggageSpace,
            acceptedCategories: dto.acceptedCategories ?? [],
            deliveryPreferences: dto.deliveryPreferences?.trim(),
            pricingType: dto.pricingType,
            pricePerKg: dto.pricePerKg,
            notes: dto.notes?.trim(),
            openToCommunitySupport: dto.openToCommunitySupport ?? false,
            willingToAssistElderly: dto.willingToAssistElderly ?? false,
            acceptReducedFee: dto.acceptReducedFee ?? false,
            acceptVolunteer: dto.acceptVolunteer ?? false,
            status: 'active',
            matchedRequestsCount: 0,
        });
        return trip;
    }
    async getMyTrips(travelerId, status) {
        const filter = {
            travelerId: new mongoose_2.Types.ObjectId(travelerId),
        };
        if (status) {
            filter.status = status;
        }
        return this.tripModel
            .find(filter)
            .sort({ departureDate: -1 })
            .exec();
    }
    async findByIdOrThrow(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Trip not found');
        }
        const trip = await this.tripModel
            .findById(id)
            .populate('travelerId', 'fullName profilePhoto')
            .exec();
        if (!trip) {
            throw new common_1.NotFoundException('Trip not found');
        }
        return trip;
    }
    async update(travelerId, id, dto) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Trip not found');
        }
        const trip = await this.tripModel.findById(id).exec();
        if (!trip) {
            throw new common_1.NotFoundException('Trip not found');
        }
        if (trip.travelerId.toString() !== travelerId) {
            throw new common_1.ForbiddenException('You can only edit your own trips');
        }
        if (trip.status === 'completed' || trip.status === 'cancelled') {
            throw new common_1.BadRequestException('Cannot edit a completed or cancelled trip');
        }
        const nextDeparture = dto.departureDate !== undefined
            ? new Date(dto.departureDate)
            : trip.departureDate;
        const nextArrival = dto.arrivalDate !== undefined ? new Date(dto.arrivalDate) : trip.arrivalDate;
        this.assertDateOrder(nextDeparture, nextArrival);
        const nextPricing = dto.pricingType ?? trip.pricingType;
        const nextPrice = dto.pricePerKg !== undefined ? dto.pricePerKg : trip.pricePerKg;
        this.assertPricing(nextPricing, nextPrice);
        if (dto.origin !== undefined)
            trip.origin = dto.origin.trim();
        if (dto.destination !== undefined)
            trip.destination = dto.destination.trim();
        if (dto.departureDate !== undefined)
            trip.departureDate = nextDeparture;
        if (dto.arrivalDate !== undefined)
            trip.arrivalDate = nextArrival;
        if (dto.luggageSpace !== undefined)
            trip.luggageSpace = dto.luggageSpace;
        if (dto.acceptedCategories !== undefined) {
            trip.acceptedCategories = dto.acceptedCategories;
        }
        if (dto.deliveryPreferences !== undefined) {
            trip.deliveryPreferences = dto.deliveryPreferences?.trim();
        }
        if (dto.pricingType !== undefined)
            trip.pricingType = dto.pricingType;
        if (dto.pricePerKg !== undefined)
            trip.pricePerKg = dto.pricePerKg;
        if (dto.notes !== undefined)
            trip.notes = dto.notes?.trim();
        if (dto.openToCommunitySupport !== undefined) {
            trip.openToCommunitySupport = dto.openToCommunitySupport;
        }
        if (dto.willingToAssistElderly !== undefined) {
            trip.willingToAssistElderly = dto.willingToAssistElderly;
        }
        if (dto.acceptReducedFee !== undefined) {
            trip.acceptReducedFee = dto.acceptReducedFee;
        }
        if (dto.acceptVolunteer !== undefined) {
            trip.acceptVolunteer = dto.acceptVolunteer;
        }
        return trip.save();
    }
    async cancelTrip(travelerId, id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Trip not found');
        }
        const trip = await this.tripModel.findById(id).exec();
        if (!trip) {
            throw new common_1.NotFoundException('Trip not found');
        }
        if (trip.travelerId.toString() !== travelerId) {
            throw new common_1.ForbiddenException('You can only cancel your own trips');
        }
        if (trip.status === 'cancelled') {
            throw new common_1.BadRequestException('Trip already cancelled');
        }
        if (trip.status === 'completed') {
            throw new common_1.BadRequestException('Cannot cancel a completed trip');
        }
        trip.status = 'cancelled';
        await trip.save();
        return { message: 'Trip cancelled' };
    }
    async browse(query) {
        const filter = { status: 'active' };
        if (query.origin?.trim()) {
            filter.origin = {
                $regex: new RegExp(escapeRegex(query.origin.trim()), 'i'),
            };
        }
        if (query.destination?.trim()) {
            filter.destination = {
                $regex: new RegExp(escapeRegex(query.destination.trim()), 'i'),
            };
        }
        const depRange = {};
        if (query.dateFrom) {
            depRange.$gte = new Date(query.dateFrom);
        }
        if (query.dateTo) {
            const end = new Date(query.dateTo);
            end.setHours(23, 59, 59, 999);
            depRange.$lte = end;
        }
        if (Object.keys(depRange).length > 0) {
            filter.departureDate = depRange;
        }
        if (query.luggageSpace) {
            filter.luggageSpace = query.luggageSpace;
        }
        if (query.category?.trim()) {
            filter.acceptedCategories = query.category.trim();
        }
        if (query.maxPrice !== undefined && query.maxPrice !== null) {
            filter.$or = [
                { pricingType: 'negotiable' },
                {
                    pricingType: 'fixed',
                    pricePerKg: { $lte: query.maxPrice },
                },
            ];
        }
        if (query.socialImpact === true) {
            filter.openToCommunitySupport = true;
        }
        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(100, Math.max(1, query.limit ?? 10));
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.tripModel
                .find(filter)
                .sort({ departureDate: 1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            this.tripModel.countDocuments(filter).exec(),
        ]);
        return { data: data, total, page, limit };
    }
};
exports.TripsService = TripsService;
exports.TripsService = TripsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(trip_schema_1.Trip.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], TripsService);
//# sourceMappingURL=trips.service.js.map