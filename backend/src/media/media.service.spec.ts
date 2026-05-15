import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MediaService } from './media.service';
import { PrismaService } from '../common/prisma.service';

describe('MediaService', () => {
  let service: MediaService;
  let prisma: PrismaService;

  const mockPrisma = {
    media: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MediaService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get<MediaService>(MediaService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should return paginated media', async () => {
    mockPrisma.media.findMany.mockResolvedValue([{ id: 1, filename: 'test.jpg', uploader: {} }]);
    mockPrisma.media.count.mockResolvedValue(1);

    const result = await service.findAll(1, 20);

    expect(result.total).toBe(1);
  });

  it('should create media record', async () => {
    const file = {
      filename: 'abc.jpg',
      originalname: 'photo.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
    } as Express.Multer.File;

    mockPrisma.media.create.mockResolvedValue({ id: 1, ...file, url: '/uploads/abc.jpg' });

    const result = await service.create(file, 1);

    expect(result.url).toBe('/uploads/abc.jpg');
    expect(mockPrisma.media.create).toHaveBeenCalledWith({
      data: {
        filename: 'abc.jpg',
        originalName: 'photo.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        url: '/uploads/abc.jpg',
        uploaderId: 1,
      },
    });
  });

  it('should throw on remove if not found', async () => {
    mockPrisma.media.findUnique.mockResolvedValue(null);
    await expect(service.remove(999)).rejects.toThrow(NotFoundException);
  });
});
