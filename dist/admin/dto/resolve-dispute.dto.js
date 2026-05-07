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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResolveDisputeDto = exports.DISPUTE_RESOLUTIONS = void 0;
const class_validator_1 = require("class-validator");
exports.DISPUTE_RESOLUTIONS = [
    'refund_requester',
    'release_traveler',
    'partial_refund',
    'no_action',
];
class ResolveDisputeDto {
    resolution;
    refundAmount;
    notes;
}
exports.ResolveDisputeDto = ResolveDisputeDto;
__decorate([
    (0, class_validator_1.IsEnum)(exports.DISPUTE_RESOLUTIONS),
    __metadata("design:type", String)
], ResolveDisputeDto.prototype, "resolution", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ResolveDisputeDto.prototype, "refundAmount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ResolveDisputeDto.prototype, "notes", void 0);
//# sourceMappingURL=resolve-dispute.dto.js.map