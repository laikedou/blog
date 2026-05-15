import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BannersService } from './banners.service';
import { PrismaService } from '../common/prisma.service';

describe('BannersService', () => {
  let service: BannersService;
  let prisma: PrismaService;

  const mockPrisma = {
    banner: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BannersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BannersService>(BannersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should return all banners ordered by sortOrder', async () => {
      const mockBanners = [
        { id: 1, title: 'Banner 1', sortOrder: 0 },
        { id: 2, title: 'Banner 2', sortOrder: 1 },
      ];
      mockPrisma.banner.findMany.mockResolvedValue(mockBanners);

      const result = await service.findAll();

      expect(result).toEqual(mockBanners);
      expect(mockPrisma.banner.findMany).toHaveBeenCalledWith({
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('findActive', () => {
    it('should return only active banners', async () => {
      const mockBanners = [
        { id: 1, title: 'Active Banner', isActive: true },
      ];
      mockPrisma.banner.findMany.mockResolvedValue(mockBanners);

      const result = await service.findActive();

      expect(result).toEqual(mockBanners);
      expect(mockPrisma.banner.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a banner by id', async () => {
      const mockBanner = { id: 1, title: 'Banner 1' };
      mockPrisma.banner.findUnique.mockResolvedValue(mockBanner);

      const result = await service.findOne(1);

      expect(result).toEqual(mockBanner);
    });

    it('should throw NotFoundException if banner not found', async () => {
      mockPrisma.banner.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a banner', async () => {
      const dto = {
        title: 'New Banner',
        imageUrl: '/uploads/banner.jpg',
        sortOrder: 0,
        isActive: true,
      };
      const created = { id: 1, ...dto };
      mockPrisma.banner.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(mockPrisma.banner.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('should update a banner', async () => {
      const existing = { id: 1, title: 'Old' };
      const dto = { title: 'Updated' };
      mockPrisma.banner.findUnique.mockResolvedValue(existing);
      mockPrisma.banner.update.mockResolvedValue({ ...existing, ...dto });

      const result = await service.update(1, dto);

      expect(mockPrisma.banner.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: dto,
      });
      expect(result.title).toBe('Updated');
    });

    it('should throw if banner not found', async () => {
      mockPrisma.banner.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { title: 'Nope' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a banner', async () => {
      mockPrisma.banner.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.banner.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1);

      expect(mockPrisma.banner.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ id: 1 });
    });

    it('should throw if banner not found', async () => {
      mockPrisma.banner.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
