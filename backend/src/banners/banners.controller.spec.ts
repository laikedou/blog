import { Test, TestingModule } from '@nestjs/testing';
import { BannersController } from './banners.controller';
import { BannersService } from './banners.service';

describe('BannersController', () => {
  let controller: BannersController;
  let service: BannersService;

  const mockService = {
    findAll: jest.fn(),
    findActive: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BannersController],
      providers: [{ provide: BannersService, useValue: mockService }],
    }).compile();

    controller = module.get<BannersController>(BannersController);
    service = module.get<BannersService>(BannersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      mockService.findAll.mockResolvedValue([]);
      const result = await controller.findAll();
      expect(mockService.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findActive', () => {
    it('should call service.findActive', async () => {
      mockService.findActive.mockResolvedValue([]);
      const result = await controller.findActive();
      expect(mockService.findActive).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with parsed id', async () => {
      mockService.findOne.mockResolvedValue({ id: 1 });
      const result = await controller.findOne('1');
      expect(mockService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('create', () => {
    it('should call service.create with dto', async () => {
      const dto = { title: 'Banner', imageUrl: '/img.jpg' };
      mockService.create.mockResolvedValue({ id: 1, ...dto });
      const result = await controller.create(dto);
      expect(mockService.create).toHaveBeenCalledWith(dto);
      expect(result.id).toBe(1);
    });
  });

  describe('update', () => {
    it('should call service.update with parsed id and dto', async () => {
      const dto = { title: 'Updated' };
      mockService.update.mockResolvedValue({ id: 1, title: 'Updated' });
      const result = await controller.update('1', dto);
      expect(mockService.update).toHaveBeenCalledWith(1, dto);
      expect(result.title).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should call service.remove with parsed id', async () => {
      mockService.remove.mockResolvedValue({ id: 1 });
      const result = await controller.remove('1');
      expect(mockService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });
  });
});
