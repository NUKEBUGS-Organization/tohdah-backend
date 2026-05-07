import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Request,
  RequestDocument,
  RequestType,
  RequestStatus,
  UrgencyLevel,
} from './schemas/request.schema';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { BrowseRequestsQueryDto } from './dto/browse-requests-query.dto';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function urgencyRank(level: UrgencyLevel | undefined): number {
  const order: Record<UrgencyLevel, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  return order[level ?? 'low'];
}

@Injectable()
export class RequestsService {
  constructor(
    @InjectModel(Request.name) private readonly requestModel: Model<RequestDocument>,
  ) {}

  assertCreateBusinessRules(dto: {
    type: RequestType;
    budget?: number;
    paymentType?: string;
    beneficiaryType?: string;
  }): void {
    if (dto.type === 'standard') {
      if (dto.budget === undefined || dto.budget === null) {
        throw new BadRequestException('budget is required for standard requests');
      }
    }
    if (dto.type === 'support') {
      if (!dto.paymentType) {
        throw new BadRequestException('paymentType is required for support requests');
      }
      if (!dto.beneficiaryType) {
        throw new BadRequestException('beneficiaryType is required for support requests');
      }
    }
  }

  async create(requesterId: string, dto: CreateRequestDto): Promise<RequestDocument> {
    this.assertCreateBusinessRules(dto);

    const doc = await this.requestModel.create({
      requesterId: new Types.ObjectId(requesterId),
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

  async getMyRequests(
    requesterId: string,
    status?: RequestStatus,
    type?: RequestType,
  ): Promise<RequestDocument[]> {
    const filter: Record<string, unknown> = {
      requesterId: new Types.ObjectId(requesterId),
    };
    if (status) filter.status = status;
    if (type) filter.type = type;
    return this.requestModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();
  }

  async browse(query: BrowseRequestsQueryDto): Promise<{
    data: RequestDocument[] | Record<string, unknown>[];
    total: number;
    page: number;
    limit: number;
  }> {
    const filter: Record<string, unknown> = { status: 'pending' };

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
      const budgetRange: Record<string, number> = {};
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
      if (ra !== rb) return ra - rb;
      return a.deliveryDeadline.getTime() - b.deliveryDeadline.getTime();
    });

    const total = all.length;
    const data = all.slice(skip, skip + limit);

    return { data: data as RequestDocument[], total, page, limit };
  }

  async findByIdOrThrow(id: string): Promise<RequestDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Request not found');
    }
    const req = await this.requestModel
      .findById(id)
      .populate('requesterId', 'fullName profilePhoto')
      .populate('matchedTravelerId', 'fullName profilePhoto')
      .exec();
    if (!req) {
      throw new NotFoundException('Request not found');
    }
    return req;
  }

  async update(
    requesterId: string,
    id: string,
    dto: UpdateRequestDto,
  ): Promise<RequestDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Request not found');
    }
    const req = await this.requestModel.findById(id).exec();
    if (!req) {
      throw new NotFoundException('Request not found');
    }
    if (req.requesterId.toString() !== requesterId) {
      throw new ForbiddenException('You can only edit your own requests');
    }
    if (req.status !== 'pending') {
      throw new BadRequestException('Only pending requests can be edited');
    }

    const nextType = dto.type ?? req.type;
    const nextBudget = dto.budget !== undefined ? dto.budget : req.budget;
    const nextPaymentType =
      dto.paymentType !== undefined ? dto.paymentType : req.paymentType;
    const nextBeneficiaryType =
      dto.beneficiaryType !== undefined ? dto.beneficiaryType : req.beneficiaryType;

    this.assertCreateBusinessRules({
      type: nextType,
      budget: nextBudget,
      paymentType: nextPaymentType,
      beneficiaryType: nextBeneficiaryType,
    });

    if (dto.type !== undefined) req.type = dto.type;
    if (dto.itemName !== undefined) req.itemName = dto.itemName.trim();
    if (dto.itemDescription !== undefined) {
      req.itemDescription = dto.itemDescription.trim();
    }
    if (dto.itemCategory !== undefined) req.itemCategory = dto.itemCategory;
    if (dto.itemSize !== undefined) req.itemSize = dto.itemSize;
    if (dto.estimatedValue !== undefined) req.estimatedValue = dto.estimatedValue;
    if (dto.origin !== undefined) req.origin = dto.origin.trim();
    if (dto.destination !== undefined) req.destination = dto.destination.trim();
    if (dto.deliveryDeadline !== undefined) {
      req.deliveryDeadline = new Date(dto.deliveryDeadline);
    }
    if (dto.budget !== undefined) req.budget = dto.budget;
    if (dto.currency !== undefined) req.currency = dto.currency.trim() || 'USD';
    if (dto.paymentType !== undefined) req.paymentType = dto.paymentType;
    if (dto.beneficiaryName !== undefined) {
      req.beneficiaryName = dto.beneficiaryName?.trim();
    }
    if (dto.beneficiaryType !== undefined) req.beneficiaryType = dto.beneficiaryType;
    if (dto.urgencyLevel !== undefined) req.urgencyLevel = dto.urgencyLevel;
    if (dto.supportingNotes !== undefined) {
      req.supportingNotes = dto.supportingNotes?.trim();
    }

    return req.save();
  }

  async cancelRequest(
    requesterId: string,
    id: string,
  ): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Request not found');
    }
    const req = await this.requestModel.findById(id).exec();
    if (!req) {
      throw new NotFoundException('Request not found');
    }
    if (req.requesterId.toString() !== requesterId) {
      throw new ForbiddenException('You can only cancel your own requests');
    }
    if (req.status !== 'pending' && req.status !== 'matched') {
      throw new BadRequestException(
        'Only pending or matched requests can be cancelled',
      );
    }
    req.status = 'cancelled';
    await req.save();
    return { message: 'Request cancelled' };
  }
}
