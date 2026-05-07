import { Model } from 'mongoose';
import { RequestDocument, RequestType, RequestStatus } from './schemas/request.schema';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { BrowseRequestsQueryDto } from './dto/browse-requests-query.dto';
export declare class RequestsService {
    private readonly requestModel;
    constructor(requestModel: Model<RequestDocument>);
    assertCreateBusinessRules(dto: {
        type: RequestType;
        budget?: number;
        paymentType?: string;
        beneficiaryType?: string;
    }): void;
    create(requesterId: string, dto: CreateRequestDto): Promise<RequestDocument>;
    getMyRequests(requesterId: string, status?: RequestStatus, type?: RequestType): Promise<RequestDocument[]>;
    browse(query: BrowseRequestsQueryDto): Promise<{
        data: RequestDocument[] | Record<string, unknown>[];
        total: number;
        page: number;
        limit: number;
    }>;
    findByIdOrThrow(id: string): Promise<RequestDocument>;
    update(requesterId: string, id: string, dto: UpdateRequestDto): Promise<RequestDocument>;
    cancelRequest(requesterId: string, id: string): Promise<{
        message: string;
    }>;
}
