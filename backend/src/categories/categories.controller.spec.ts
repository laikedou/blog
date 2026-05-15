import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: CategoriesService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: mockService }],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      mockService.findAll.mockResolvedValue([]);
      const result = await controller.findAll();
      expect(mockService.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with parsed id', async () => {
      mockService.findOne.mockResolvedValue({ id: 1, name: 'AI' });
      const result = await controller.findOne(1);
      expect(mockService.findOne).toHaveBeenCalledWith(1);
      expect(result.name).toBe('AI');
    });
  });

  describe('create', () => {
    it('should call service.create with dto', async () => {
      const dto = { name: 'New Category' };
      mockService.create.mockResolvedValue({ id: 1, name: 'New Category' });
      const result = await controller.create(dto);
      expect(mockService.create).toHaveBeenCalledWith(dto);
      expect(result.id).toBe(1);
    });
  });

  describe('update', () => {
    it('should call service.update with parsed id and dto', async () => {
      const dto = { name: 'Updated' };
      mockService.update.mockResolvedValue({ id: 1, name: 'Updated' });
      const result = await controller.update(1, dto);
      expect(mockService.update).toHaveBeenCalledWith(1, dto);
      expect(result.name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should call service.remove with parsed id', async () => {
      mockService.remove.mockResolvedValue({ message: 'Category deleted' });
      const result = await controller.remove(1);
      expect(mockService.remove).toHaveBeenCalledWith(1);
      expect(result.message).toBe('Category deleted');
    });
  });
});
