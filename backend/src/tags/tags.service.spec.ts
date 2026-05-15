import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TagsService } from './tags.service';
import { PrismaService } from '../common/prisma.service';

describe('TagsService', () => {
  let service: TagsService;
  let prisma: PrismaService;

  const mockPrisma = {
    tag: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    postTag: {
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TagsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get<TagsService>(TagsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should return all tags', async () => {
    mockPrisma.tag.findMany.mockResolvedValue([
      { id: 1, name: 'JS', slug: 'js', _count: { posts: 5 } },
    ]);

    const result = await service.findAll();

    expect(result[0].postCount).toBe(5);
  });

  it('should throw on findOne if not found', async () => {
    mockPrisma.tag.findUnique.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('should auto-slug on create', async () => {
    mockPrisma.tag.create.mockResolvedValue({ id: 1, name: 'New Tag', slug: 'new-tag' });

    const result = await service.create({ name: 'New Tag' });

    expect(result.slug).toBe('new-tag');
  });

  it('should delete tag and its relations', async () => {
    mockPrisma.tag.findUnique.mockResolvedValue({ id: 1 });
    const result = await service.remove(1);

    expect(mockPrisma.postTag.deleteMany).toHaveBeenCalledWith({ where: { tagId: 1 } });
    expect(result.message).toBe('Tag deleted');
  });
});
