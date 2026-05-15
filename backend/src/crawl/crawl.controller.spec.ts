import { Test, TestingModule } from '@nestjs/testing';
import { CrawlController } from './crawl.controller';
import { CrawlService } from './crawl.service';

describe('CrawlController', () => {
  let controller: CrawlController;
  let service: CrawlService;

  const mockService = {
    getSources: jest.fn(),
    createSource: jest.fn(),
    updateSource: jest.fn(),
    deleteSource: jest.fn(),
    crawlSource: jest.fn(),
    getArticles: jest.fn(),
    getArticle: jest.fn(),
    publishArticle: jest.fn(),
    deleteArticle: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CrawlController],
      providers: [{ provide: CrawlService, useValue: mockService }],
    }).compile();

    controller = module.get<CrawlController>(CrawlController);
    service = module.get<CrawlService>(CrawlService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should get sources', async () => {
    mockService.getSources.mockResolvedValue([]);
    const result = await controller.getSources();
    expect(result).toEqual([]);
  });

  it('should create a source', async () => {
    const dto = { name: 'Source', url: 'https://example.com', interval: 60 };
    mockService.createSource.mockResolvedValue({ id: 1, ...dto });
    const result = await controller.createSource(dto);
    expect(result.id).toBe(1);
  });

  it('should update a source with parsed id', async () => {
    const dto = { name: 'Updated' };
    mockService.updateSource.mockResolvedValue({ id: 1, name: 'Updated' });
    const result = await controller.updateSource(1, dto);
    expect(mockService.updateSource).toHaveBeenCalledWith(1, dto);
    expect(result.name).toBe('Updated');
  });

  it('should delete a source with parsed id', async () => {
    mockService.deleteSource.mockResolvedValue({ message: 'Deleted' });
    const result = await controller.deleteSource(1);
    expect(mockService.deleteSource).toHaveBeenCalledWith(1);
  });

  it('should run a crawl source with parsed id', async () => {
    mockService.crawlSource.mockResolvedValue({ discovered: 5, new: 2 });
    const result = await controller.runSource(1);
    expect(mockService.crawlSource).toHaveBeenCalledWith(1);
    expect(result.new).toBe(2);
  });

  it('should get articles', async () => {
    mockService.getArticles.mockResolvedValue([]);
    const result = await controller.getArticles();
    expect(result).toEqual([]);
  });

  it('should get article with parsed id', async () => {
    mockService.getArticle.mockResolvedValue({ id: 1, title: 'Article' });
    const result = await controller.getArticle(1);
    expect(mockService.getArticle).toHaveBeenCalledWith(1);
  });

  it('should publish article with parsed id', async () => {
    mockService.publishArticle.mockResolvedValue({ message: 'Published' });
    const result = await controller.publishArticle(1);
    expect(mockService.publishArticle).toHaveBeenCalledWith(1);
  });

  it('should delete article with parsed id', async () => {
    mockService.deleteArticle.mockResolvedValue({ message: 'Deleted' });
    const result = await controller.deleteArticle(1);
    expect(mockService.deleteArticle).toHaveBeenCalledWith(1);
  });
});
