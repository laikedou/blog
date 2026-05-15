import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

describe('CommentsController', () => {
  let controller: CommentsController;
  let service: CommentsService;

  const mockService = {
    findByPost: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [{ provide: CommentsService, useValue: mockService }],
    }).compile();

    controller = module.get<CommentsController>(CommentsController);
    service = module.get<CommentsService>(CommentsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findByPost', () => {
    it('should call service.findByPost with parsed postId', async () => {
      mockService.findByPost.mockResolvedValue([]);
      const result = await controller.findByPost(1);
      expect(mockService.findByPost).toHaveBeenCalledWith(1);
      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with pagination', async () => {
      mockService.findAll.mockResolvedValue({ data: [], total: 0 });
      const result = await controller.findAll(1, 20);
      expect(mockService.findAll).toHaveBeenCalledWith(1, 20);
      expect(result.total).toBe(0);
    });
  });

  describe('create', () => {
    it('should call service.create with dto and user', async () => {
      const dto = { postId: 1, content: 'Nice post!' };
      const user = { id: 1 };
      mockService.create.mockResolvedValue({ id: 1, content: 'Nice post!' });

      const result = await controller.create(dto, user);

      expect(mockService.create).toHaveBeenCalledWith(dto, 1);
      expect(result.id).toBe(1);
    });
  });

  describe('update', () => {
    it('should call service.update with parsed id and dto', async () => {
      const dto = { content: 'Updated' };
      mockService.update.mockResolvedValue({ id: 1, content: 'Updated' });
      const result = await controller.update(1, dto);
      expect(mockService.update).toHaveBeenCalledWith(1, dto);
      expect(result.content).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should call service.remove with parsed id', async () => {
      mockService.remove.mockResolvedValue({ message: 'Comment deleted' });
      const result = await controller.remove(1);
      expect(mockService.remove).toHaveBeenCalledWith(1);
      expect(result.message).toBe('Comment deleted');
    });
  });
});
