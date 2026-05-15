import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/prisma.service';

// Mock bcryptjs since it uses ESM interop that jest.spyOn can't handle
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('test-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      displayName: 'Test User',
    };

    it('should register a new user successfully', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 1, email: registerDto.email, username: registerDto.username,
        password: 'hashed', displayName: registerDto.displayName, role: 'user',
      });

      const result = await service.register(registerDto);

      expect(mockPrisma.user.findFirst).toHaveBeenCalled();
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(result.access_token).toBe('test-token');
    });

    it('should throw ConflictException if email or username exists', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 1, email: registerDto.email });
      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginDto = { username: 'testuser', password: 'password123' };
    const mockUser = {
      id: 1, email: 'test@example.com', username: 'testuser',
      password: 'hashedpassword', displayName: 'Test User', role: 'user',
    };

    it('should login successfully with valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockResolvedValue(true);

      const result = await service.login(loginDto);
      expect(result.access_token).toBe('test-token');
    });

    it('should throw UnauthorizedException for invalid username', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user without password', async () => {
      const mockUser = { id: 1, email: 'test@example.com', username: 'testuser', displayName: 'Test', avatar: '', role: 'user' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser(1);
      expect(result).toEqual(mockUser);
    });
  });
});
