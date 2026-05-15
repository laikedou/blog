import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

describe('PostsController', () => {
  let controller: PostsController;
  let service: PostsService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findBySlug: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [{ provide: PostsService, useValue: mockService }],
    }).compile();

    controller = module.get<PostsController>(PostsController);
    service = module.get<PostsService>(PostsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should call service.findAll with query', async () => {
      const query = { page: 1, limit: 10, status: 'published' };
      mockService.findAll.mockResolvedValue({ data: [], total: 0 });

      const result = await controller.findAll(query);

      expect(mockService.findAll).toHaveBeenCalledWith(query);
      expect(result.total).toBe(0);
    });
  });

  describe('findBySlug', () => {
    it('should call service.findBySlug', async () => {
      mockService.findBySlug.mockResolvedValue({ id: 1, slug: 'test-post' });
      const result = await controller.findBySlug('test-post');
      expect(mockService.findBySlug).toHaveBeenCalledWith('test-post');
      expect(result.slug).toBe('test-post');
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with parsed id', async () => {
      mockService.findOne.mockResolvedValue({ id: 1, title: 'Post' });
      const result = await controller.findOne(1);
      expect(mockService.findOne).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
    });
  });

  describe('create', () => {
    it('should call service.create with dto and user id', async () => {
      const dto = { title: 'New Post', content: '<p>Hello</p>', status: 'draft' };
      const user = { id: 1 };
      mockService.create.mockResolvedValue({ id: 1, title: 'New Post' });

      const result = await controller.create(dto, user);

      expect(mockService.create).toHaveBeenCalledWith(dto, 1);
      expect(result.id).toBe(1);
    });
  });

  describe('update', () => {
    it('should call service.update with parsed id and dto', async () => {
      const dto = { title: 'Updated' };
      mockService.update.mockResolvedValue({ id: 1, title: 'Updated' });

      const result = await controller.update(1, dto);

      expect(mockService.update).toHaveBeenCalledWith(1, dto);
      expect(result.title).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should call service.remove with parsed id', async () => {
      mockService.remove.mockResolvedValue({ message: 'Post deleted' });
      const result = await controller.remove(1);
      expect(mockService.remove).toHaveBeenCalledWith(1);
      expect(result.message).toBe('Post deleted');
    });
  });
});
