import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../common/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: PrismaService;

  const mockPrisma = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('check', () => {
    it('should return healthy when DB is connected', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      const result = await controller.check();

      expect(result.status).toBe('healthy');
      expect(result.database).toBe('connected');
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it('should return unhealthy when DB fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection failed'));

      const result = await controller.check();

      expect(result.status).toBe('unhealthy');
      expect(result.database).toBe('disconnected');
    });
  });
});
