import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { Request, RequestDocument } from './schemas/request.schema';
import { RequestsService } from './requests.service';

describe('RequestsService', () => {
  let service: RequestsService;
  let model: jest.Mocked<Pick<Model<RequestDocument>, 'create' | 'find' | 'findById'>>;

  const ownerId = new Types.ObjectId().toString();
  const otherId = new Types.ObjectId().toString();
  const requestId = new Types.ObjectId().toString();

  const standardDto = {
    type: 'standard' as const,
    itemName: 'Box',
    itemDescription: 'Books',
    itemCategory: 'documents' as const,
    itemSize: 'small' as const,
    origin: 'NYC',
    destination: 'BOS',
    deliveryDeadline: '2030-07-01T12:00:00.000Z',
    budget: 50,
  };

  const supportDto = {
    type: 'support' as const,
    itemName: 'Groceries',
    itemDescription: 'Weekly shop',
    itemCategory: 'food' as const,
    itemSize: 'medium' as const,
    origin: 'A',
    destination: 'B',
    deliveryDeadline: '2030-07-02T12:00:00.000Z',
    paymentType: 'volunteer' as const,
    beneficiaryType: 'elderly' as const,
  };

  beforeEach(async () => {
    model = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        {
          provide: getModelToken(Request.name),
          useValue: model,
        },
      ],
    }).compile();

    service = module.get(RequestsService);
  });

  describe('create', () => {
    it('creates standard request with budget', async () => {
      const saved = {
        _id: requestId,
        ...standardDto,
        deliveryDeadline: new Date(standardDto.deliveryDeadline),
      } as RequestDocument;
      model.create.mockResolvedValue(saved as never);

      const res = await service.create(ownerId, standardDto);

      expect(res).toBe(saved);
      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({
          requesterId: new Types.ObjectId(ownerId),
          type: 'standard',
          budget: 50,
          currency: 'USD',
          status: 'pending',
        }),
      );
    });

    it('throws when standard request missing budget', async () => {
      await expect(
        service.create(ownerId, {
          ...standardDto,
          budget: undefined,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(model.create).not.toHaveBeenCalled();
    });

    it('throws when support request missing paymentType', async () => {
      await expect(
        service.create(ownerId, {
          ...supportDto,
          paymentType: undefined,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(model.create).not.toHaveBeenCalled();
    });

    it('throws when support request missing beneficiaryType', async () => {
      await expect(
        service.create(ownerId, {
          ...supportDto,
          beneficiaryType: undefined,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(model.create).not.toHaveBeenCalled();
    });
  });

  describe('getMyRequests', () => {
    it('queries only current requester requests', async () => {
      const exec = jest.fn().mockResolvedValue([]);
      const sort = jest.fn().mockReturnValue({ exec });
      model.find.mockReturnValue({ sort } as never);

      await service.getMyRequests(ownerId, undefined, undefined);

      expect(model.find).toHaveBeenCalledWith({
        requesterId: new Types.ObjectId(ownerId),
      });
      expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });

  describe('cancelRequest', () => {
    it('throws ForbiddenException for non-owner', async () => {
      const req = {
        requesterId: new Types.ObjectId(ownerId),
        status: 'pending',
        save: jest.fn(),
      } as unknown as RequestDocument;
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(req),
      } as never);

      await expect(service.cancelRequest(otherId, requestId)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(req.save).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when status is confirmed', async () => {
      const req = {
        requesterId: new Types.ObjectId(ownerId),
        status: 'confirmed',
        save: jest.fn(),
      } as unknown as RequestDocument;
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(req),
      } as never);

      await expect(service.cancelRequest(ownerId, requestId)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(req.save).not.toHaveBeenCalled();
    });
  });

  describe('browse', () => {
    it('queries only pending requests', async () => {
      model.find.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      } as never);

      await service.browse({});

      expect(model.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' }),
      );
    });
  });
});
