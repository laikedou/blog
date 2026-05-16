import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VisualizationService } from './visualization.service';
import { VisualizationAiService } from './visualization-ai.service';
import { PrismaService } from '../common/prisma.service';
import { CloudflareAiService } from '../common/cloudflare-ai.service';

describe('VisualizationService', () => {
  let service: VisualizationService;
  let prisma: any;
  let ai: any;

  const mockPrisma = {
    visualization: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn().mockResolvedValue({ id: 1 }),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    visualizationVersion: {
      create: jest.fn(),
    },
    visualizationStat: {
      create: jest.fn(),
      groupBy: jest.fn(),
    },
    $queryRaw: jest.fn().mockResolvedValue([]),
  };

  const mockAi = {
    generate: jest.fn(),
    refine: jest.fn(),
    getProvider: jest.fn(),
    getAvailableProviders: jest.fn().mockReturnValue(['gemini']),
    getDefaultProvider: jest.fn().mockReturnValue('gemini'),
    validate: jest.fn(),
  };

  const mockCloudflareAi = {
    buildVisualizationCoverPrompt: jest.fn().mockReturnValue('prompt'),
    generateCover: jest.fn().mockResolvedValue('/uploads/covers/test.png'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisualizationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: VisualizationAiService, useValue: mockAi },
        { provide: CloudflareAiService, useValue: mockCloudflareAi },
      ],
    }).compile();

    service = module.get<VisualizationService>(VisualizationService);
    prisma = module.get(PrismaService);
    ai = module.get(VisualizationAiService);
  });

  describe('generate', () => {
    const dto = { prompt: 'Pythagorean theorem', subject: 'math' as const };
    const authorId = 1;

    it('should call AI and create visualization with initial version', async () => {
      mockAi.generate.mockResolvedValue({ code: 'function Visualization(){}', raw: '...' });
      mockPrisma.visualization.create.mockResolvedValue({ id: 1, title: 'Pythagorean theorem', subject: 'math', htmlContent: 'function Visualization(){}' });
      mockPrisma.visualizationVersion.create.mockResolvedValue({ id: 1 });

      const result = await service.generate(dto, authorId);

      expect(mockAi.generate).toHaveBeenCalledWith('Pythagorean theorem', 'math', undefined);
      expect(mockPrisma.visualization.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ subject: 'math', authorId: 1 }) }),
      );
      expect(mockPrisma.visualizationVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ version: 1, changeNote: 'Initial generation' }) }),
      );
      expect(result.rawAiResponse).toBe('...');
    });

    it('should use custom title when provided', async () => {
      mockAi.generate.mockResolvedValue({ code: 'fn(){}', raw: '' });
      mockPrisma.visualization.create.mockResolvedValue({ id: 2, title: 'Custom Title' });
      mockPrisma.visualizationVersion.create.mockResolvedValue({ id: 1 });

      const withTitle = { ...dto, title: 'Custom Title' };
      const result = await service.generate(withTitle, authorId);

      expect(mockPrisma.visualization.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ title: 'Custom Title' }) }),
      );
      expect(result.title).toBe('Custom Title');
    });

    it('should pass provider name to AI service', async () => {
      mockAi.generate.mockResolvedValue({ code: 'fn(){}', raw: '' });
      mockPrisma.visualization.create.mockResolvedValue({ id: 3, title: 'Test' });
      mockPrisma.visualizationVersion.create.mockResolvedValue({ id: 1 });

      await service.generate({ ...dto, provider: 'grok' }, authorId);

      expect(mockAi.generate).toHaveBeenCalledWith('Pythagorean theorem', 'math', 'grok');
    });
  });

  describe('refine', () => {
    it('should throw NotFoundException when visualization does not exist', async () => {
      mockPrisma.visualization.findFirst.mockResolvedValue(null);
      await expect(service.refine({ visualizationId: 999, feedback: 'fix it' }, 1))
        .rejects.toThrow(NotFoundException);
    });

    it('should increment version and save new version', async () => {
      mockPrisma.visualization.findFirst.mockResolvedValue({ id: 1, authorId: 1, htmlContent: 'old code', version: 2 });
      mockAi.refine.mockResolvedValue({ code: 'new code', raw: '...' });
      mockPrisma.visualization.update.mockResolvedValue({ id: 1, version: 3, htmlContent: 'new code' });
      mockPrisma.visualizationVersion.create.mockResolvedValue({ id: 1 });

      const result = await service.refine({ visualizationId: 1, feedback: 'make it interactive' }, 1);

      expect(mockAi.refine).toHaveBeenCalledWith('old code', 'make it interactive');
      expect(mockPrisma.visualization.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ htmlContent: 'new code', version: 3 }) }),
      );
      expect(result.version).toBe(3);
      expect(result.htmlContent).toBe('new code');
    });
  });

  describe('CRUD', () => {
    it('create should save visualization and initial version', async () => {
      mockPrisma.visualization.create.mockResolvedValue({ id: 1, title: 'Test', subject: 'math' });
      mockPrisma.visualizationVersion.create.mockResolvedValue({ id: 1 });

      const result = await service.create(
        { title: 'Test', subject: 'math', htmlContent: 'fn(){}', prompt: 'prompt' },
        1,
      );

      expect(mockPrisma.visualization.create).toHaveBeenCalled();
      expect(mockPrisma.visualizationVersion.create).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });

    it('findAll should paginate and filter', async () => {
      mockPrisma.visualization.findMany.mockResolvedValue([{ id: 1, title: 'Test' }]);
      mockPrisma.visualization.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(mockPrisma.visualization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10, orderBy: { createdAt: 'desc' } }),
      );
      expect(result.page).toBe(2);
      expect(result.total).toBe(1);
    });

    it('findAll should apply subject filter', async () => {
      mockPrisma.visualization.findMany.mockResolvedValue([]);
      mockPrisma.visualization.count.mockResolvedValue(0);

      await service.findAll({ subject: 'physics' });

      expect(mockPrisma.visualization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ subject: 'physics' }) }),
      );
    });

    it('findOne should return visualization with versions', async () => {
      const viz = { id: 1, title: 'Test', versions: [] };
      mockPrisma.visualization.findUnique.mockResolvedValue(viz);

      const result = await service.findOne(1);
      expect(result).toEqual(viz);
    });

    it('findOne should throw when not found', async () => {
      mockPrisma.visualization.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('update should check author ownership', async () => {
      mockPrisma.visualization.findFirst.mockResolvedValue(null);
      await expect(service.update(1, { title: 'New' }, 999)).rejects.toThrow(NotFoundException);
    });

    it('update should modify visualization', async () => {
      mockPrisma.visualization.findFirst.mockResolvedValue({ id: 1, authorId: 1 });
      mockPrisma.visualization.update.mockResolvedValue({ id: 1, title: 'Updated' });

      const result = await service.update(1, { title: 'Updated' }, 1);
      expect(mockPrisma.visualization.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 }, data: { title: 'Updated' } }),
      );
    });

    it('publish should update status', async () => {
      mockPrisma.visualization.findFirst.mockResolvedValue({ id: 1, authorId: 1 });
      mockPrisma.visualization.update.mockResolvedValue({ id: 1, status: 'published' });

      const result = await service.publish(1, 'published', 1);
      expect(result.status).toBe('published');
    });

    it('remove should delete visualization', async () => {
      mockPrisma.visualization.findFirst.mockResolvedValue({ id: 1, authorId: 1 });
      mockPrisma.visualization.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1, 1);
      expect(result.deleted).toBe(true);
    });
  });

  describe('stats', () => {
    it('recordStat should create stat entry', async () => {
      mockPrisma.visualizationStat.create.mockResolvedValue({ id: 1, action: 'view' });

      const result = await service.recordStat(1, 'view', { source: 'test' });
      expect(mockPrisma.visualizationStat.create).toHaveBeenCalledWith({
        data: { visualizationId: 1, action: 'view', metadata: '{"source":"test"}' },
      });
    });

    it('getStats should throw when visualization not found', async () => {
      mockPrisma.visualization.findUnique.mockResolvedValue(null);
      await expect(service.getStats(999)).rejects.toThrow(NotFoundException);
    });

    it('getStats should return aggregated stats', async () => {
      mockPrisma.visualization.findUnique.mockResolvedValue({ id: 1, viewCount: 10, interactCount: 5 });
      mockPrisma.visualizationStat.groupBy.mockResolvedValue([
        { action: 'view', _count: 5 },
        { action: 'interact', _count: 3 },
      ]);

      const result = await service.getStats(1);
      expect(result.viewCount).toBe(10);
      expect(result.interactCount).toBe(5);
      expect(result.actions.view).toBe(5);
      expect(result.actions.interact).toBe(3);
    });
  });

  describe('getAggregatedStats', () => {
    it('should return aggregated data across all visualizations', async () => {
      mockPrisma.visualization.aggregate.mockResolvedValue({ _sum: { viewCount: 100, interactCount: 50 } });
      mockPrisma.visualization.groupBy
        .mockResolvedValueOnce([{ subject: 'math', _count: { id: 5 } }])
        .mockResolvedValueOnce([{ status: 'published', _count: { id: 3 } }]);
      mockPrisma.visualization.count.mockResolvedValue(10);

      const result = await service.getAggregatedStats();
      expect(result.totalViews).toBe(100);
      expect(result.totalVisualizations).toBe(10);
    });
  });
});
