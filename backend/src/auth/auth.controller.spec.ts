import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockService = {
    register: jest.fn(),
    login: jest.fn(),
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('should call service.register', async () => {
      const dto = { email: 'test@test.com', username: 'testuser', password: 'pass123', displayName: 'Test' };
      mockService.register.mockResolvedValue({ access_token: 'token', user: { id: 1 } });

      const result = await controller.register(dto);

      expect(mockService.register).toHaveBeenCalledWith(dto);
      expect(result.access_token).toBe('token');
    });
  });

  describe('login', () => {
    it('should call service.login', async () => {
      const dto = { username: 'testuser', password: 'pass123' };
      mockService.login.mockResolvedValue({ access_token: 'token', user: { id: 1 } });

      const result = await controller.login(dto);

      expect(mockService.login).toHaveBeenCalledWith(dto);
      expect(result.access_token).toBe('token');
    });
  });

  describe('getProfile', () => {
    it('should call service.validateUser with current user id', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockService.validateUser.mockResolvedValue(mockUser);

      const result = await controller.getProfile(mockUser);

      expect(mockService.validateUser).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });
  });
});
