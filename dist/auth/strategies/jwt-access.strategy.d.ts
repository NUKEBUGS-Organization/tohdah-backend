import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
export type AccessJwtPayload = {
    sub: string;
    email: string;
};
export type RequestUser = {
    userId: string;
    email: string;
};
declare const JwtAccessStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtAccessStrategy extends JwtAccessStrategy_base {
    constructor(config: ConfigService);
    validate(payload: AccessJwtPayload): RequestUser;
}
export {};
