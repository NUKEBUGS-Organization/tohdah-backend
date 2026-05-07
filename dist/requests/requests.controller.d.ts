import type { RequestUser } from '../auth/strategies/jwt-access.strategy';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { GetMyRequestsQueryDto } from './dto/get-my-requests-query.dto';
import { BrowseRequestsQueryDto } from './dto/browse-requests-query.dto';
export declare class RequestsController {
    private readonly requestsService;
    constructor(requestsService: RequestsService);
    create(user: RequestUser, dto: CreateRequestDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/request.schema").Request, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/request.schema").Request & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    getMyRequests(user: RequestUser, query: GetMyRequestsQueryDto): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/request.schema").Request, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/request.schema").Request & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    })[]>;
    browse(query: BrowseRequestsQueryDto): Promise<{
        data: import("./schemas/request.schema").RequestDocument[] | Record<string, unknown>[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/request.schema").Request, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/request.schema").Request & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    update(user: RequestUser, id: string, dto: UpdateRequestDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/request.schema").Request, {}, import("mongoose").DefaultSchemaOptions> & import("./schemas/request.schema").Request & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    cancel(user: RequestUser, id: string): Promise<{
        message: string;
    }>;
}
