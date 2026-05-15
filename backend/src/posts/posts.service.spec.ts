import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PrismaService } from '../common/prisma.service';
import { CloudflareAiService } from '../common/cloudflare-ai.service';

describe('PostsService', () => {
  let service: PostsService;
  let prisma: PrismaService;

  const mockPrisma = {
    post: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    postTag: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockCloudflareAi = {
    buildCoverPrompt: jest.fn().mockReturnValue('Generated cover prompt'),
    generateCover: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CloudflareAiService, useValue: mockCloudflareAi },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should return paginated posts', async () => {
      const mockPosts = [
        { id: 1, title: 'Post 1', tags: [{ tag: { id: 1, name: 'Tag1' } }], _count: { comments: 5 } },
      ];
      mockPrisma.post.findMany.mockResolvedValue(mockPosts);
      mockPrisma.post.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should apply search filter', async () => {
      mockPrisma.post.findMany.mockResolvedValue([]);
      mockPrisma.post.count.mockResolvedValue(0);

      await service.findAll({ search: 'test', page: 1, limit: 10 });

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'test' } },
              { content: { contains: 'test' } },
            ],
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a post by id', async () => {
      const mockPost = { id: 1, title: 'Test', tags: [{ tag: { id: 1, name: 'Tag1' } }], comments: [] };
      mockPrisma.post.findUnique.mockResolvedValue(mockPost);

      const result = await service.findOne(1);

      expect(result.tags).toEqual([{ id: 1, name: 'Tag1' }]);
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return a post and increment view count', async () => {
      const mockPost = {
        id: 1,
        title: 'Test',
        slug: 'test',
        viewCount: 5,
        tags: [],
        comments: [],
      };
      mockPrisma.post.findUnique.mockResolvedValue(mockPost);
      mockPrisma.post.update.mockResolvedValue({ ...mockPost, viewCount: 6 });

      const result = await service.findBySlug('test');

      expect(result.viewCount).toBe(5); // returns original
      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { viewCount: 6 },
      });
    });
  });

  describe('create', () => {
    it('should create a post with tags', async () => {
      const dto = {
        title: 'New Post',
        content: '<p>Hello</p>',
        status: 'published',
        tagIds: [1, 2],
        categoryId: 1,
      };
      const createdPost = { id: 1, title: 'New Post', status: 'published' };

      mockPrisma.post.create.mockResolvedValue(createdPost);
      mockPrisma.postTag.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.post.findUnique.mockResolvedValue({
        ...createdPost,
        tags: [{ tag: { id: 1, name: 'Tag1' } }, { tag: { id: 2, name: 'Tag2' } }],
        comments: [],
      });

      const result = await service.create(dto, 1);

      expect(mockPrisma.post.create).toHaveBeenCalled();
      expect(mockPrisma.postTag.createMany).toHaveBeenCalledWith({
        data: [{ postId: 1, tagId: 1 }, { postId: 1, tagId: 2 }],
      });
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should delete a post', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.post.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1);

      expect(result.message).toBe('Post deleted');
    });

    it('should throw if post not found', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
