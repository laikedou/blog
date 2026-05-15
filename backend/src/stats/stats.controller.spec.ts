import { Test, TestingModule } from '@nestjs/testing';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

describe('StatsController', () => {
  let controller: StatsController;
  let service: StatsService;

  const mockService = {
    getDashboard: jest.fn(),
    getPostStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatsController],
      providers: [{ provide: StatsService, useValue: mockService }],
    }).compile();

    controller = module.get<StatsController>(StatsController);
    service = module.get<StatsService>(StatsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getDashboard', () => {
    it('should call service.getDashboard', async () => {
      mockService.getDashboard.mockResolvedValue({ overview: { totalPosts: 10 } });
      const result = await controller.getDashboard();
      expect(mockService.getDashboard).toHaveBeenCalled();
      expect(result.overview.totalPosts).toBe(10);
    });
  });

  describe('getPostStats', () => {
    it('should call service.getPostStats with parsed id', async () => {
      mockService.getPostStats.mockResolvedValue({ id: 1, viewCount: 100 });
      const result = await controller.getPostStats(1);
      expect(mockService.getPostStats).toHaveBeenCalledWith(1);
      expect(result.viewCount).toBe(100);
    });
  });
});
