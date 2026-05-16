import { Test, TestingModule } from '@nestjs/testing';
import { VisualizationController } from './visualization.controller';
import { VisualizationService } from './visualization.service';
import { VisualizationAiService } from './visualization-ai.service';
import { AiUsageService } from '../ai-usage/ai-usage.service';

describe('VisualizationController', () => {
  let controller: VisualizationController;
  let service: any;
  let ai: any;

  const mockService = {
    generate: jest.fn(),
    refine: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findPublished: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    publish: jest.fn(),
    remove: jest.fn(),
    recordStat: jest.fn(),
    getStats: jest.fn(),
    getAggregatedStats: jest.fn(),
  };

  const mockAi = {
    getAvailableProviders: jest.fn().mockReturnValue(['gemini', 'grok']),
    getDefaultProvider: jest.fn().mockReturnValue('gemini'),
    getProvider: jest.fn().mockReturnValue({ model: 'test-model' }),
  };

  const mockAiUsage = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VisualizationController],
      providers: [
        { provide: VisualizationService, useValue: mockService },
        { provide: VisualizationAiService, useValue: mockAi },
        { provide: AiUsageService, useValue: mockAiUsage },
      ],
    }).compile();

    controller = module.get<VisualizationController>(VisualizationController);
    service = module.get(VisualizationService);
    ai = module.get(VisualizationAiService);
  });

  describe('AI generation endpoints', () => {
    describe('generate', () => {
      it('should call service.generate with dto and user id', async () => {
        const dto = { prompt: 'Pythagorean theorem', subject: 'math' };
        const req = { user: { id: 1 } };
        mockService.generate.mockResolvedValue({ id: 1, htmlContent: 'code' });

        const result = await controller.generate(dto, req);

        expect(mockService.generate).toHaveBeenCalledWith(dto, 1);
        expect(result.id).toBe(1);
      });
    });

    describe('refine', () => {
      it('should call service.refine with dto and user id', async () => {
        const dto = { visualizationId: 1, feedback: 'make it better' };
        const req = { user: { id: 1 } };
        mockService.refine.mockResolvedValue({ id: 1, version: 2, htmlContent: 'refined' });

        const result = await controller.refine(dto, req);

        expect(mockService.refine).toHaveBeenCalledWith(dto, 1);
        expect(result.version).toBe(2);
      });
    });

    describe('getProviders', () => {
      it('should return available providers and default', async () => {
        const result = controller.getProviders();
        expect(result.providers).toEqual(['gemini', 'grok']);
        expect(result.default).toBe('gemini');
      });
    });
  });

  describe('CRUD endpoints', () => {
    describe('create', () => {
      it('should create visualization manually', async () => {
        const dto = { title: 'Test', subject: 'math', htmlContent: 'fn(){}' };
        const req = { user: { id: 1 } };
        mockService.create.mockResolvedValue({ id: 1, title: 'Test' });

        const result = await controller.create(dto, req);
        expect(mockService.create).toHaveBeenCalledWith(dto, 1);
        expect(result.title).toBe('Test');
      });
    });

    describe('findAll', () => {
      it('should return paginated results', async () => {
        mockService.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });

        const result = await controller.findAll({});
        expect(mockService.findAll).toHaveBeenCalled();
        expect(result.total).toBe(0);
      });

      it('should pass query params', async () => {
        const query = { subject: 'math', status: 'published', page: 1, limit: 10 };
        mockService.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });

        await controller.findAll(query);
        expect(mockService.findAll).toHaveBeenCalledWith(query);
      });
    });

    describe('findPublished', () => {
      it('should return only published visualizations', async () => {
        mockService.findPublished.mockResolvedValue({ data: [{ id: 1, status: 'published' }], total: 1 });

        const result = await controller.findPublished({});
        expect(mockService.findPublished).toHaveBeenCalled();
        expect(result.data[0].status).toBe('published');
      });
    });

    describe('findOne', () => {
      it('should return a single visualization', async () => {
        mockService.findOne.mockResolvedValue({ id: 1, title: 'Test' });

        const result = await controller.findOne('1');
        expect(mockService.findOne).toHaveBeenCalledWith(1);
        expect(result.title).toBe('Test');
      });

      it('should pass numeric id', async () => {
        mockService.findOne.mockResolvedValue({ id: 42 });
        await controller.findOne('42');
        expect(mockService.findOne).toHaveBeenCalledWith(42);
      });
    });

    describe('update', () => {
      it('should update visualization', async () => {
        const dto = { title: 'Updated' };
        const req = { user: { id: 1 } };
        mockService.update.mockResolvedValue({ id: 1, title: 'Updated' });

        const result = await controller.update('1', dto, req);
        expect(mockService.update).toHaveBeenCalledWith(1, dto, 1);
      });
    });

    describe('publish', () => {
      it('should toggle publish status', async () => {
        const req = { user: { id: 1 } };
        mockService.publish.mockResolvedValue({ id: 1, status: 'published' });

        const result = await controller.publish('1', { status: 'published' }, req);
        expect(mockService.publish).toHaveBeenCalledWith(1, 'published', 1);
        expect(result.status).toBe('published');
      });
    });

    describe('remove', () => {
      it('should delete visualization', async () => {
        const req = { user: { id: 1 } };
        mockService.remove.mockResolvedValue({ deleted: true });

        const result = await controller.remove('1', req);
        expect(mockService.remove).toHaveBeenCalledWith(1, 1);
        expect(result.deleted).toBe(true);
      });
    });
  });

  describe('Stats endpoints', () => {
    describe('recordStat', () => {
      it('should record a stat event', async () => {
        mockService.recordStat.mockResolvedValue({ id: 1 });

        await controller.recordStat('1', { action: 'view', metadata: { page: 'test' } });
        expect(mockService.recordStat).toHaveBeenCalledWith(1, 'view', { page: 'test' });
      });
    });

    describe('getStats', () => {
      it('should return stats for a visualization', async () => {
        mockService.getStats.mockResolvedValue({ viewCount: 10, actions: { view: 5 } });

        const result = await controller.getStats('1');
        expect(mockService.getStats).toHaveBeenCalledWith(1);
        expect(result.viewCount).toBe(10);
      });
    });

    describe('getAggregatedStats', () => {
      it('should return aggregated stats', async () => {
        mockService.getAggregatedStats.mockResolvedValue({ totalViews: 100, totalVisualizations: 5 });

        const result = await controller.getAggregatedStats();
        expect(result.totalViews).toBe(100);
      });
    });
  });
});
