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
exports.CreateRequestDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const request_schema_1 = require("../schemas/request.schema");
class CreateRequestDto {
    type;
    itemName;
    itemDescription;
    itemCategory;
    itemSize;
    estimatedValue;
    origin;
    destination;
    deliveryDeadline;
    budget;
    currency;
    paymentType;
    beneficiaryName;
    beneficiaryType;
    urgencyLevel;
    supportingNotes;
}
exports.CreateRequestDto = CreateRequestDto;
__decorate([
    (0, class_validator_1.IsIn)([...request_schema_1.REQUEST_TYPES]),
    __metadata("design:type", Object)
], CreateRequestDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "itemName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "itemDescription", void 0);
__decorate([
    (0, class_validator_1.IsIn)([...request_schema_1.ITEM_CATEGORIES]),
    __metadata("design:type", Object)
], CreateRequestDto.prototype, "itemCategory", void 0);
__decorate([
    (0, class_validator_1.IsIn)([...request_schema_1.ITEM_SIZES]),
    __metadata("design:type", Object)
], CreateRequestDto.prototype, "itemSize", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateRequestDto.prototype, "estimatedValue", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "origin", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "destination", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "deliveryDeadline", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateRequestDto.prototype, "budget", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)([...request_schema_1.PAYMENT_TYPES]),
    __metadata("design:type", Object)
], CreateRequestDto.prototype, "paymentType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "beneficiaryName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)([...request_schema_1.BENEFICIARY_TYPES]),
    __metadata("design:type", Object)
], CreateRequestDto.prototype, "beneficiaryType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)([...request_schema_1.URGENCY_LEVELS]),
    __metadata("design:type", Object)
], CreateRequestDto.prototype, "urgencyLevel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "supportingNotes", void 0);
//# sourceMappingURL=create-request.dto.js.map