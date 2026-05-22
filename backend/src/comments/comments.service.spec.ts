import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { PrismaService } from '../common/prisma.service';
import { NotificationsGateway } from '../common/notifications.gateway';

describe('CommentsService', () => {
  let service: CommentsService;
  let prisma: PrismaService;

  const mockPrisma = {
    comment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    post: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockNotifications = {
    notifyComment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsGateway, useValue: mockNotifications },
      ],
    }).compile();
    service = module.get<CommentsService>(CommentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should find comments by post', async () => {
    mockPrisma.comment.findMany.mockResolvedValue([{ id: 1, content: 'Nice post!', replies: [] }]);

    const result = await service.findByPost(1);

    expect(mockPrisma.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ postId: 1 }) }),
    );
    expect(result).toHaveLength(1);
  });

  it('should paginate all comments', async () => {
    mockPrisma.comment.findMany.mockResolvedValue([{ id: 1, content: 'Test', post: {}, author: {} }]);
    mockPrisma.comment.count.mockResolvedValue(1);

    const result = await service.findAll(1, 20);

    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
  });

  it('should create a comment', async () => {
    mockPrisma.post.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.comment.create.mockResolvedValue({ id: 1, content: 'Great!', author: {} });

    const result = await service.create({ postId: 1, content: 'Great!' }, 1);

    expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result.content).toBe('Great!');
  });

  it('should throw if post not found on create', async () => {
    mockPrisma.post.findUnique.mockResolvedValue(null);

    await expect(service.create({ postId: 999, content: 'Test' }, 1)).rejects.toThrow(NotFoundException);
  });

  it('should throw on remove if not found', async () => {
    mockPrisma.comment.findUnique.mockResolvedValue(null);
    await expect(service.remove(999)).rejects.toThrow(NotFoundException);
  });
});
