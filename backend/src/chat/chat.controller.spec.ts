import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

describe('ChatController', () => {
  let controller: ChatController;
  let service: ChatService;

  const mockService = {
    logMessage: jest.fn(),
    submitFeedback: jest.fn(),
    searchPosts: jest.fn(),
    getStats: jest.fn(),
    getFeedback: jest.fn(),
    markFeedbackRead: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [{ provide: ChatService, useValue: mockService }],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    service = module.get<ChatService>(ChatService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('logMessage', () => {
    it('should call service.logMessage', async () => {
      const dto = { sessionId: 's1', role: 'user', content: 'Hello' };
      mockService.logMessage.mockResolvedValue({ id: 1 });
      const result = await controller.logMessage(dto);
      expect(mockService.logMessage).toHaveBeenCalledWith(dto);
      expect(result.id).toBe(1);
    });
  });

  describe('submitFeedback', () => {
    it('should call service.submitFeedback', async () => {
      const dto = { sessionId: 's1', name: 'Test', message: 'Nice blog' };
      mockService.submitFeedback.mockResolvedValue({ id: 1 });
      const result = await controller.submitFeedback(dto);
      expect(mockService.submitFeedback).toHaveBeenCalledWith(dto);
      expect(result.id).toBe(1);
    });
  });

  describe('searchPosts', () => {
    it('should call service.searchPosts', async () => {
      mockService.searchPosts.mockResolvedValue([]);
      const result = await controller.searchPosts({ query: 'AI', limit: 5 });
      expect(mockService.searchPosts).toHaveBeenCalledWith('AI', 5);
      expect(result).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should call service.getStats', async () => {
      mockService.getStats.mockResolvedValue({ totalSessions: 10 });
      const result = await controller.getStats();
      expect(mockService.getStats).toHaveBeenCalled();
      expect(result.totalSessions).toBe(10);
    });
  });

  describe('getFeedback', () => {
    it('should call service.getFeedback with defaults', async () => {
      mockService.getFeedback.mockResolvedValue({ data: [], total: 0 });
      await controller.getFeedback();
      expect(mockService.getFeedback).toHaveBeenCalledWith(1, 20);
    });

    it('should call service.getFeedback with pagination', async () => {
      mockService.getFeedback.mockResolvedValue({ data: [], total: 0 });
      await controller.getFeedback('2', '10');
      expect(mockService.getFeedback).toHaveBeenCalledWith(2, 10);
    });
  });

  describe('markFeedbackRead', () => {
    it('should call service.markFeedbackRead with parsed id', async () => {
      mockService.markFeedbackRead.mockResolvedValue({ id: 1, isRead: true });
      const result = await controller.markFeedbackRead('1');
      expect(mockService.markFeedbackRead).toHaveBeenCalledWith(1);
      expect(result.isRead).toBe(true);
    });
  });
});
