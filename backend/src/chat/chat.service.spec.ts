import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '../common/prisma.service';

describe('ChatService', () => {
  let service: ChatService;
  let prisma: PrismaService;

  const mockPrisma = {
    chatMessage: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    feedback: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    post: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('logMessage', () => {
    it('should log a chat message', async () => {
      const dto = { sessionId: 'session_1', role: 'user', content: 'Hello' };
      mockPrisma.chatMessage.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.logMessage(dto);

      expect(mockPrisma.chatMessage.create).toHaveBeenCalledWith({ data: dto });
      expect(result.id).toBe(1);
    });
  });

  describe('logMessages', () => {
    it('should log multiple messages', async () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ];
      mockPrisma.chatMessage.createMany.mockResolvedValue({ count: 2 });

      await service.logMessages('session_1', messages);

      expect(mockPrisma.chatMessage.createMany).toHaveBeenCalled();
    });
  });

  describe('submitFeedback', () => {
    it('should submit feedback', async () => {
      const dto = { sessionId: 'session_1', name: 'Test', email: 'test@test.com', message: 'Great blog!', pageUrl: '/' };
      mockPrisma.feedback.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.submitFeedback(dto);

      expect(mockPrisma.feedback.create).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });
  });

  describe('getFeedback', () => {
    it('should return paginated feedback', async () => {
      const mockFeedback = [{ id: 1, message: 'Feedback 1' }];
      mockPrisma.feedback.findMany.mockResolvedValue(mockFeedback);
      mockPrisma.feedback.count.mockResolvedValue(1);

      const result = await service.getFeedback(1, 20);

      expect(result.data).toEqual(mockFeedback);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });
  });

  describe('markFeedbackRead', () => {
    it('should mark feedback as read', async () => {
      mockPrisma.feedback.update.mockResolvedValue({ id: 1, isRead: true });

      const result = await service.markFeedbackRead(1);

      expect(mockPrisma.feedback.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isRead: true },
      });
      expect(result.isRead).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return chat statistics', async () => {
      mockPrisma.chatMessage.groupBy.mockResolvedValue([{ sessionId: 's1' }, { sessionId: 's2' }]);
      mockPrisma.chatMessage.count.mockResolvedValueOnce(10); // total messages
      mockPrisma.feedback.count.mockResolvedValue(3);
      mockPrisma.chatMessage.count.mockResolvedValueOnce(5); // recent messages
      mockPrisma.chatMessage.findMany.mockResolvedValue([
        { role: 'user', content: 'What is AI?', createdAt: new Date() },
        { role: 'user', content: 'What is AI?', createdAt: new Date() },
        { role: 'user', content: 'Tell me about Web3', createdAt: new Date() },
      ]);

      const result = await service.getStats();

      expect(result.totalSessions).toBe(2);
      expect(result.totalMessages).toBe(10);
      expect(result.totalFeedback).toBe(3);
      expect(result.recentMessages).toBe(5);
      expect(result.frequentQueries.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('searchPosts', () => {
    it('should search published posts by query', async () => {
      const mockPosts = [
        {
          id: 1,
          title: 'AI Development',
          slug: 'ai-development',
          excerpt: 'About AI',
          category: { name: 'AI' },
          tags: [{ tag: { name: 'artificial-intelligence' } }],
        },
      ];
      mockPrisma.post.findMany.mockResolvedValue(mockPosts);

      const result = await service.searchPosts('AI');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('AI Development');
      expect(result[0].url).toBe('/posts/ai-development');
      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'published' }),
        }),
      );
    });

    it('should return empty array when no matches', async () => {
      mockPrisma.post.findMany.mockResolvedValue([]);

      const result = await service.searchPosts('nonexistent');

      expect(result).toHaveLength(0);
    });
  });
});
