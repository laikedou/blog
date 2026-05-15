import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../common/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: PrismaService;

  const mockPrisma = {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    post: {
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoriesService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should return all categories with post count', async () => {
    mockPrisma.category.findMany.mockResolvedValue([
      { id: 1, name: 'Tech', slug: 'tech', _count: { posts: 3 } },
    ]);

    const result = await service.findAll();

    expect(result[0].postCount).toBe(3);
    expect(result[0]._count).toBeUndefined();
  });

  it('should throw on findOne if not found', async () => {
    mockPrisma.category.findUnique.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('should create a category with auto-slug', async () => {
    mockPrisma.category.create.mockResolvedValue({ id: 1, name: 'New Cat', slug: 'new-cat' });

    const result = await service.create({ name: 'New Cat' });

    expect(mockPrisma.category.create).toHaveBeenCalledWith({
      data: { name: 'New Cat', slug: 'new-cat' },
    });
    expect(result.slug).toBe('new-cat');
  });

  it('should delete category and uncategorize posts', async () => {
    mockPrisma.category.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.post.updateMany.mockResolvedValue({ count: 2 });
    mockPrisma.category.delete.mockResolvedValue({ id: 1 });

    const result = await service.remove(1);

    expect(mockPrisma.post.updateMany).toHaveBeenCalledWith({
      where: { categoryId: 1 },
      data: { categoryId: null },
    });
    expect(result.message).toBe('Category deleted');
  });
});
