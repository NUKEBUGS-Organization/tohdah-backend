import { REPORT_REASONS } from '../schemas/user-report.schema';
export declare class ReportUserDto {
    targetUserId: string;
    reason: (typeof REPORT_REASONS)[number];
    description?: string;
}
