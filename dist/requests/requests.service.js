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
exports.RequestsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const request_schema_1 = require("./schemas/request.schema");
function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function urgencyRank(level) {
    const order = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
    };
    return order[level ?? 'low'];
}
let RequestsService = class RequestsService {
    requestModel;
    constructor(requestModel) {
        this.requestModel = requestModel;
    }
    assertCreateBusinessRules(dto) {
        if (dto.type === 'standard') {
            if (dto.budget === undefined || dto.budget === null) {
                throw new common_1.BadRequestException('budget is required for standard requests');
            }
        }
        if (dto.type === 'support') {
            if (!dto.paymentType) {
                throw new common_1.BadRequestException('paymentType is required for support requests');
            }
            if (!dto.beneficiaryType) {
                throw new common_1.BadRequestException('beneficiaryType is required for support requests');
            }
        }
    }
    async create(requesterId, dto) {
        this.assertCreateBusinessRules(dto);
        const doc = await this.requestModel.create({
            requesterId: new mongoose_2.Types.ObjectId(requesterId),
            type: dto.type,
            itemName: dto.itemName.trim(),
            itemDescription: dto.itemDescription.trim(),
            itemCategory: dto.itemCategory,
            itemSize: dto.itemSize,
            estimatedValue: dto.estimatedValue,
            origin: dto.origin.trim(),
            destination: dto.destination.trim(),
            deliveryDeadline: new Date(dto.deliveryDeadline),
            budget: dto.budget,
            currency: dto.currency?.trim() || 'USD',
            paymentType: dto.paymentType,
            beneficiaryName: dto.beneficiaryName?.trim(),
            beneficiaryType: dto.beneficiaryType,
            urgencyLevel: dto.urgencyLevel ?? 'low',
            supportingNotes: dto.supportingNotes?.trim(),
            status: 'pending',
        });
        return doc;
    }
    async getMyRequests(requesterId, status, type) {
        const filter = {
            requesterId: new mongoose_2.Types.ObjectId(requesterId),
        };
        if (status)
            filter.status = status;
        if (type)
            filter.type = type;
        return this.requestModel
            .find(filter)
            .sort({ createdAt: -1 })
            .exec();
    }
    async browse(query) {
        const filter = { status: 'pending' };
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
        if (query.type) {
            filter.type = query.type;
        }
        if (query.supportOnly === true) {
            filter.type = 'support';
        }
        if (query.itemCategory) {
            filter.itemCategory = query.itemCategory;
        }
        if (query.itemSize) {
            filter.itemSize = query.itemSize;
        }
        if (query.urgencyLevel) {
            filter.urgencyLevel = query.urgencyLevel;
        }
        if (query.minBudget !== undefined || query.maxBudget !== undefined) {
            const budgetRange = {};
            if (query.minBudget !== undefined) {
                budgetRange.$gte = query.minBudget;
            }
            if (query.maxBudget !== undefined) {
                budgetRange.$lte = query.maxBudget;
            }
            filter.$or = [
                { type: 'support' },
                { type: 'standard', budget: budgetRange },
            ];
        }
        if (query.deadlineBefore) {
            const end = new Date(query.deadlineBefore);
            end.setHours(23, 59, 59, 999);
            filter.deliveryDeadline = { $lte: end };
        }
        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(100, Math.max(1, query.limit ?? 10));
        const skip = (page - 1) * limit;
        const all = await this.requestModel.find(filter).lean().exec();
        all.sort((a, b) => {
            const ra = urgencyRank(a.urgencyLevel);
            const rb = urgencyRank(b.urgencyLevel);
            if (ra !== rb)
                return ra - rb;
            return a.deliveryDeadline.getTime() - b.deliveryDeadline.getTime();
        });
        const total = all.length;
        const data = all.slice(skip, skip + limit);
        return { data: data, total, page, limit };
    }
    async findByIdOrThrow(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Request not found');
        }
        const req = await this.requestModel
            .findById(id)
            .populate('requesterId', 'fullName profilePhoto')
            .populate('matchedTravelerId', 'fullName profilePhoto')
            .exec();
        if (!req) {
            throw new common_1.NotFoundException('Request not found');
        }
        return req;
    }
    async update(requesterId, id, dto) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Request not found');
        }
        const req = await this.requestModel.findById(id).exec();
        if (!req) {
            throw new common_1.NotFoundException('Request not found');
        }
        if (req.requesterId.toString() !== requesterId) {
            throw new common_1.ForbiddenException('You can only edit your own requests');
        }
        if (req.status !== 'pending') {
            throw new common_1.BadRequestException('Only pending requests can be edited');
        }
        const nextType = dto.type ?? req.type;
        const nextBudget = dto.budget !== undefined ? dto.budget : req.budget;
        const nextPaymentType = dto.paymentType !== undefined ? dto.paymentType : req.paymentType;
        const nextBeneficiaryType = dto.beneficiaryType !== undefined ? dto.beneficiaryType : req.beneficiaryType;
        this.assertCreateBusinessRules({
            type: nextType,
            budget: nextBudget,
            paymentType: nextPaymentType,
            beneficiaryType: nextBeneficiaryType,
        });
        if (dto.type !== undefined)
            req.type = dto.type;
        if (dto.itemName !== undefined)
            req.itemName = dto.itemName.trim();
        if (dto.itemDescription !== undefined) {
            req.itemDescription = dto.itemDescription.trim();
        }
        if (dto.itemCategory !== undefined)
            req.itemCategory = dto.itemCategory;
        if (dto.itemSize !== undefined)
            req.itemSize = dto.itemSize;
        if (dto.estimatedValue !== undefined)
            req.estimatedValue = dto.estimatedValue;
        if (dto.origin !== undefined)
            req.origin = dto.origin.trim();
        if (dto.destination !== undefined)
            req.destination = dto.destination.trim();
        if (dto.deliveryDeadline !== undefined) {
            req.deliveryDeadline = new Date(dto.deliveryDeadline);
        }
        if (dto.budget !== undefined)
            req.budget = dto.budget;
        if (dto.currency !== undefined)
            req.currency = dto.currency.trim() || 'USD';
        if (dto.paymentType !== undefined)
            req.paymentType = dto.paymentType;
        if (dto.beneficiaryName !== undefined) {
            req.beneficiaryName = dto.beneficiaryName?.trim();
        }
        if (dto.beneficiaryType !== undefined)
            req.beneficiaryType = dto.beneficiaryType;
        if (dto.urgencyLevel !== undefined)
            req.urgencyLevel = dto.urgencyLevel;
        if (dto.supportingNotes !== undefined) {
            req.supportingNotes = dto.supportingNotes?.trim();
        }
        return req.save();
    }
    async cancelRequest(requesterId, id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Request not found');
        }
        const req = await this.requestModel.findById(id).exec();
        if (!req) {
            throw new common_1.NotFoundException('Request not found');
        }
        if (req.requesterId.toString() !== requesterId) {
            throw new common_1.ForbiddenException('You can only cancel your own requests');
        }
        if (req.status !== 'pending' && req.status !== 'matched') {
            throw new common_1.BadRequestException('Only pending or matched requests can be cancelled');
        }
        req.status = 'cancelled';
        await req.save();
        return { message: 'Request cancelled' };
    }
};
exports.RequestsService = RequestsService;
exports.RequestsService = RequestsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(request_schema_1.Request.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], RequestsService);
//# sourceMappingURL=requests.service.js.map