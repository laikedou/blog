import { Test, TestingModule } from '@nestjs/testing';
import { VisualizationAiService } from './visualization-ai.service';
import { AiUsageService } from '../ai-usage/ai-usage.service';

const mockAiUsage = {
  log: jest.fn().mockResolvedValue(undefined),
};

const testProviders = [
  VisualizationAiService,
  { provide: AiUsageService, useValue: mockAiUsage },
];

describe('VisualizationAiService', () => {
  let service: VisualizationAiService;

  beforeEach(async () => {
    mockAiUsage.log.mockClear();
    // Clear env between tests
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROK_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const module: TestingModule = await Test.createTestingModule({
      providers: testProviders,
    }).compile();

    service = module.get<VisualizationAiService>(VisualizationAiService);
  });

  describe('provider registration', () => {
    it('should have no providers when no API keys set', () => {
      expect(service.getAvailableProviders()).toEqual([]);
      expect(service.getDefaultProvider()).toBeNull();
    });

    it('should register gemini when GEMINI_API_KEY is set', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      const mod = await Test.createTestingModule({
        providers: testProviders,
      }).compile();
      const s = mod.get<VisualizationAiService>(VisualizationAiService);
      expect(s.getAvailableProviders()).toContain('gemini');
      expect(s.getDefaultProvider()).toBe('gemini');
    });

    it('should register grok when GROK_API_KEY is set', async () => {
      process.env.GROK_API_KEY = 'test-grok-key';
      const mod = await Test.createTestingModule({
        providers: testProviders,
      }).compile();
      const s = mod.get<VisualizationAiService>(VisualizationAiService);
      expect(s.getAvailableProviders()).toContain('grok');
    });

    it('should prefer grok over gemini for default', async () => {
      process.env.GEMINI_API_KEY = 'gk';
      process.env.GROK_API_KEY = 'xk';
      const mod = await Test.createTestingModule({
        providers: testProviders,
      }).compile();
      const s = mod.get<VisualizationAiService>(VisualizationAiService);
      expect(s.getDefaultProvider()).toBe('grok');
    });
  });

  describe('getProvider', () => {
    it('should throw when no providers configured', () => {
      expect(() => service.getProvider()).toThrow(/No AI provider configured/);
    });

    it('should throw when requested provider is not available', async () => {
      process.env.GEMINI_API_KEY = 'gk';
      const mod = await Test.createTestingModule({
        providers: testProviders,
      }).compile();
      const s = mod.get<VisualizationAiService>(VisualizationAiService);
      expect(() => s.getProvider('nonexistent')).toThrow(/not available/);
    });
  });

  describe('validate', () => {
    it('should throw when no provider configured', async () => {
      process.env.GEMINI_API_KEY = 'gk';
      const mod = await Test.createTestingModule({
        providers: testProviders,
      }).compile();
      const s = mod.get<VisualizationAiService>(VisualizationAiService);
      const provider = s.getProvider('gemini');
      const result = provider.validateCode('function Visualization() { return null; }');
      expect(result.valid).toBe(true);
    });

    it('should reject empty code', async () => {
      process.env.GEMINI_API_KEY = 'gk';
      const mod = await Test.createTestingModule({
        providers: testProviders,
      }).compile();
      const s = mod.get<VisualizationAiService>(VisualizationAiService);
      const provider = s.getProvider('gemini');
      const result = provider.validateCode('');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
