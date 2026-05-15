import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      mockService.findAll.mockResolvedValue({ data: [], total: 0 });
      const result = await controller.findAll();
      expect(mockService.findAll).toHaveBeenCalled();
      expect(result.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with parsed id', async () => {
      mockService.findOne.mockResolvedValue({ id: 1, username: 'test' });
      const result = await controller.findOne(1);
      expect(mockService.findOne).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
    });
  });

  describe('updateProfile', () => {
    it('should call service.update with current user id', async () => {
      const dto = { displayName: 'Updated' };
      const user = { id: 1 };
      mockService.update.mockResolvedValue({ id: 1, displayName: 'Updated' });

      const result = await controller.updateProfile(user, dto);

      expect(mockService.update).toHaveBeenCalledWith(1, dto);
      expect(result.displayName).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should call service.remove with parsed id', async () => {
      mockService.remove.mockResolvedValue({ message: 'User deleted' });
      const result = await controller.remove(1);
      expect(mockService.remove).toHaveBeenCalledWith(1);
      expect(result.message).toBe('User deleted');
    });
  });
});
