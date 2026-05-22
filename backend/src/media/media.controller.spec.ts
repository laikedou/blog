import { Test, TestingModule } from '@nestjs/testing';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

describe('MediaController', () => {
  let controller: MediaController;
  let service: MediaService;

  const mockService = {
    findAll: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [{ provide: MediaService, useValue: mockService }],
    }).compile();

    controller = module.get<MediaController>(MediaController);
    service = module.get<MediaService>(MediaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should call service.findAll with query', async () => {
      mockService.findAll.mockResolvedValue({ data: [], total: 0 });
      const result = await controller.findAll({ page: 1, limit: 20 });
      expect(mockService.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
      expect(result.total).toBe(0);
    });

    it('should handle empty query', async () => {
      mockService.findAll.mockResolvedValue({ data: [], total: 0 });
      const result = await controller.findAll({});
      expect(mockService.findAll).toHaveBeenCalledWith({});
      expect(result.total).toBe(0);
    });
  });

  describe('upload', () => {
    it('should call service.create with file and user', async () => {
      const file = { filename: 'test.jpg', originalname: 'test.jpg', mimetype: 'image/jpeg', size: 1024 } as Express.Multer.File;
      const user = { id: 1 };
      mockService.create.mockResolvedValue({ id: 1, url: '/uploads/test.jpg' });

      const result = await controller.upload(file, user);

      expect(mockService.create).toHaveBeenCalledWith(file, 1);
      expect(result.url).toBe('/uploads/test.jpg');
    });
  });

  describe('remove', () => {
    it('should call service.remove with parsed id', async () => {
      mockService.remove.mockResolvedValue({ message: 'Media deleted' });
      const result = await controller.remove(1);
      expect(mockService.remove).toHaveBeenCalledWith(1);
      expect(result.message).toBe('Media deleted');
    });
  });
});
