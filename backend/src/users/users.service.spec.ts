import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../common/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should return paginated users', async () => {
    mockPrisma.user.findMany.mockResolvedValue([{ id: 1, username: 'test', displayName: 'Test' }]);
    mockPrisma.user.count.mockResolvedValue(1);

    const result = await service.findAll();

    expect(result.total).toBe(1);
  });

  it('should throw on findOne if not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('should update user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.user.update.mockResolvedValue({ id: 1, displayName: 'Updated' });

    const result = await service.update(1, { displayName: 'Updated' });

    expect(result.displayName).toBe('Updated');
  });

  it('should delete user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.user.delete.mockResolvedValue({ id: 1 });

    const result = await service.remove(1);

    expect(result.message).toBe('User deleted');
  });
});
