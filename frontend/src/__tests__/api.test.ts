// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  it('imports without errors', () => {
    expect(() => {
      require('../lib/api');
    }).not.toThrow();
  });

  it('has all expected API modules', () => {
    const api = require('../lib/api');
    expect(api.auth).toBeDefined();
    expect(api.posts).toBeDefined();
    expect(api.categories).toBeDefined();
    expect(api.tags).toBeDefined();
    expect(api.comments).toBeDefined();
    expect(api.media).toBeDefined();
    expect(api.crawl).toBeDefined();
    expect(api.banners).toBeDefined();
    expect(api.chat).toBeDefined();
    expect(api.ai).toBeDefined();
    expect(api.stats).toBeDefined();
  });

  it('auth.login calls correct endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'token', user: { id: 1 } }),
    });

    const { auth } = require('../lib/api');
    const result = await auth.login('testuser', 'password123');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ username: 'testuser', password: 'password123' }),
      }),
    );
    expect(result.access_token).toBe('token');
  });

  it('auth.register calls correct endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'token', user: { id: 1 } }),
    });

    const { auth } = require('../lib/api');
    await auth.register({ email: 'a@b.com', username: 'user', password: 'pass' });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/auth/register',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', username: 'user', password: 'pass' }),
      }),
    );
  });

  it('posts.list builds query string', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [], total: 0 }),
    });

    const { posts } = require('../lib/api');
    await posts.list({ page: 1, limit: 10, status: 'published' });

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('page=1');
    expect(calledUrl).toContain('limit=10');
    expect(calledUrl).toContain('status=published');
  });

  it('handles API errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Unauthorized' }),
      status: 401,
    });

    const { auth } = require('../lib/api');
    await expect(auth.login('bad', 'creds')).rejects.toThrow('Unauthorized');
  });

  it('attaches auth token from localStorage', async () => {
    localStorageMock.getItem.mockReturnValue('test-jwt-token');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const { posts } = require('../lib/api');
    await posts.list();

    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders['Authorization']).toBe('Bearer test-jwt-token');
  });

  it('media.upload uses FormData', async () => {
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, url: '/uploads/test.png' }),
    });

    const { media } = require('../lib/api');
    await media.upload(file);

    expect(mockFetch.mock.calls[0][1].body).toBeInstanceOf(FormData);
    // Content-Type should be removed for FormData
    expect(mockFetch.mock.calls[0][1].headers['Content-Type']).toBeUndefined();
  });

  describe('banners API', () => {
    it('banners.list calls correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, title: 'Banner 1' }],
      });

      const { banners } = require('../lib/api');
      const result = await banners.list();

      expect(mockFetch).toHaveBeenCalledWith('/api/banners', expect.any(Object));
      expect(result).toHaveLength(1);
    });

    it('banners.active calls active endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, title: 'Active' }],
      });

      const { banners } = require('../lib/api');
      await banners.active();

      expect(mockFetch).toHaveBeenCalledWith('/api/banners/active', expect.any(Object));
    });

    it('banners.create sends POST', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, title: 'New' }),
      });

      const { banners } = require('../lib/api');
      await banners.create({ title: 'New', imageUrl: '/img.jpg' });

      expect(mockFetch.mock.calls[0][1].method).toBe('POST');
    });

    it('banners.update sends PUT', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, title: 'Updated' }),
      });

      const { banners } = require('../lib/api');
      await banners.update(1, { title: 'Updated' });

      expect(mockFetch.mock.calls[0][1].method).toBe('PUT');
    });

    it('banners.delete sends DELETE', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Deleted' }),
      });

      const { banners } = require('../lib/api');
      await banners.delete(1);

      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE');
    });
  });

  describe('chat API', () => {
    it('chat.logMessage logs a message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      });

      const { chat } = require('../lib/api');
      await chat.logMessage({ sessionId: 's1', role: 'user', content: 'Hello' });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/chat/log',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('chat.submitFeedback submits feedback', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      });

      const { chat } = require('../lib/api');
      await chat.submitFeedback({ sessionId: 's1', message: 'Great blog!' });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/chat/feedback',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('chat.searchPosts searches posts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, title: 'AI Post' }],
      });

      const { chat } = require('../lib/api');
      const result = await chat.searchPosts('AI');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/chat/search',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(result[0].title).toBe('AI Post');
    });

    it('chat.getStats fetches stats', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ totalSessions: 5 }),
      });

      const { chat } = require('../lib/api');
      const result = await chat.getStats();

      expect(mockFetch).toHaveBeenCalledWith('/api/chat/stats', expect.any(Object));
      expect(result.totalSessions).toBe(5);
    });

    it('chat.getFeedback fetches feedback list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], total: 0 }),
      });

      const { chat } = require('../lib/api');
      await chat.getFeedback(1, 20);

      expect(mockFetch).toHaveBeenCalledWith('/api/chat/feedback?page=1&limit=20', expect.any(Object));
    });

    it('chat.markFeedbackRead marks feedback as read', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, isRead: true }),
      });

      const { chat } = require('../lib/api');
      await chat.markFeedbackRead(1);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/chat/feedback/1/read',
        expect.objectContaining({ method: 'PUT' }),
      );
    });
  });

  describe('AI API - cover & banner generation', () => {
    it('ai.generateCover calls correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: '/uploads/cover.png', prompt: 'Generated cover' }),
      });

      const { ai } = require('../lib/api');
      const result = await ai.generateCover({ title: 'Test Post', excerpt: 'Excerpt' });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/ai/generate-cover',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ title: 'Test Post', excerpt: 'Excerpt' }),
        }),
      );
      expect(result.url).toBe('/uploads/cover.png');
    });

    it('ai.generateBanner calls correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: '/uploads/banner.png', prompt: 'Banner prompt' }),
      });

      const { ai } = require('../lib/api');
      const result = await ai.generateBanner({ title: 'Banner Title', subtitle: 'Sub', height: 400 });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/ai/generate-banner',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ title: 'Banner Title', subtitle: 'Sub', height: 400 }),
        }),
      );
      expect(result.url).toBe('/uploads/banner.png');
    });
  });

  describe('visualizations API', () => {
    it('visualizations.list builds query params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], total: 0 }),
      });

      const { visualizations } = require('../lib/api');
      await visualizations.list({ subject: 'math', status: 'published', page: 1 });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('subject=math');
      expect(calledUrl).toContain('status=published');
      expect(calledUrl).toContain('page=1');
    });

    it('visualizations.listPublished calls published endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], total: 0 }),
      });

      const { visualizations } = require('../lib/api');
      await visualizations.listPublished({ subject: 'physics' });

      expect(mockFetch.mock.calls[0][0]).toContain('/visualizations/published');
    });

    it('visualizations.get fetches by id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, title: 'Pythagorean Theorem', htmlContent: 'fn(){}' }),
      });

      const { visualizations } = require('../lib/api');
      const result = await visualizations.get(1);

      expect(mockFetch).toHaveBeenCalledWith('/api/visualizations/1', expect.any(Object));
      expect(result.title).toBe('Pythagorean Theorem');
    });

    it('visualizations.generate sends POST', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, htmlContent: 'fn(){}' }),
      });

      const { visualizations } = require('../lib/api');
      await visualizations.generate({ prompt: 'test', subject: 'math', provider: 'gemini' });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/visualizations/generate',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('visualizations.refine sends POST', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, version: 2, htmlContent: 'refined' }),
      });

      const { visualizations } = require('../lib/api');
      const result = await visualizations.refine({ visualizationId: 1, feedback: 'fix it' });

      expect(mockFetch.mock.calls[0][1].method).toBe('POST');
      expect(result.version).toBe(2);
    });

    it('visualizations.getProviders fetches providers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ providers: ['gemini', 'grok'], default: 'gemini' }),
      });

      const { visualizations } = require('../lib/api');
      const result = await visualizations.getProviders();

      expect(mockFetch).toHaveBeenCalledWith('/api/visualizations/providers', expect.any(Object));
      expect(result.default).toBe('gemini');
    });

    it('visualizations.create sends POST', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, title: 'Manual' }),
      });

      const { visualizations } = require('../lib/api');
      await visualizations.create({ title: 'Manual', subject: 'physics', htmlContent: '<div>fn()</div>' });

      expect(mockFetch.mock.calls[0][1].method).toBe('POST');
    });

    it('visualizations.update sends PUT', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1 }) });

      const { visualizations } = require('../lib/api');
      await visualizations.update(1, { title: 'Updated' });

      expect(mockFetch.mock.calls[0][1].method).toBe('PUT');
    });

    it('visualizations.publish sends PUT', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1, status: 'published' }) });

      const { visualizations } = require('../lib/api');
      await visualizations.publish(1, 'published');

      expect(mockFetch.mock.calls[0][0]).toContain('/publish');
      expect(mockFetch.mock.calls[0][1].method).toBe('PUT');
    });

    it('visualizations.delete sends DELETE', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ deleted: true }) });

      const { visualizations } = require('../lib/api');
      await visualizations.delete(1);

      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE');
    });

    it('visualizations.recordStat sends POST', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1 }) });

      const { visualizations } = require('../lib/api');
      await visualizations.recordStat(1, 'view', { source: 'test' });

      expect(mockFetch.mock.calls[0][1].method).toBe('POST');
      expect(JSON.parse(mockFetch.mock.calls[0][1].body).action).toBe('view');
    });

    it('visualizations.getStats fetches stats', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ viewCount: 10, interactCount: 5 }),
      });

      const { visualizations } = require('../lib/api');
      const result = await visualizations.getStats(1);

      expect(mockFetch).toHaveBeenCalledWith('/api/visualizations/1/stats', expect.any(Object));
      expect(result.viewCount).toBe(10);
    });

    it('visualizations.getAggregatedStats fetches aggregated stats', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ totalViews: 100, totalVisualizations: 10 }),
      });

      const { visualizations } = require('../lib/api');
      const result = await visualizations.getAggregatedStats();

      expect(mockFetch).toHaveBeenCalledWith('/api/visualizations/stats/aggregated', expect.any(Object));
      expect(result.totalVisualizations).toBe(10);
    });

    // ── Version Management ──

    it('visualizations.getVersions fetches version list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 3, version: 3, changeNote: 'Refined', isCurrent: true },
          { id: 2, version: 2, changeNote: 'Initial', isCurrent: false },
        ],
      });

      const { visualizations } = require('../lib/api');
      const result = await visualizations.getVersions(1);

      expect(mockFetch).toHaveBeenCalledWith('/api/visualizations/1/versions', expect.any(Object));
      expect(result).toHaveLength(2);
      expect(result[0].isCurrent).toBe(true);
    });

    it('visualizations.getVersionDetail fetches a specific version', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 2, version: 2, htmlContent: '<div>v2</div>', isCurrent: false }),
      });

      const { visualizations } = require('../lib/api');
      const result = await visualizations.getVersionDetail(1, 2);

      expect(mockFetch).toHaveBeenCalledWith('/api/visualizations/1/versions/2', expect.any(Object));
      expect(result.htmlContent).toBe('<div>v2</div>');
    });

    it('visualizations.restoreVersion sends POST with changeNote', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: 4, htmlContent: '<div>restored</div>' }),
      });

      const { visualizations } = require('../lib/api');
      const result = await visualizations.restoreVersion(1, 2, 'Going back');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/visualizations/1/versions/2/restore',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(JSON.parse(mockFetch.mock.calls[0][1].body).changeNote).toBe('Going back');
      expect(result.version).toBe(4);
    });

    it('visualizations.restoreVersion works without changeNote', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: 4, htmlContent: '<div>restored</div>' }),
      });

      const { visualizations } = require('../lib/api');
      await visualizations.restoreVersion(1, 2);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.changeNote).toBeUndefined();
    });

    it('visualizations.compareVersions sends POST with from/to', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          from: { version: 1 },
          to: { version: 2 },
          htmlContentFrom: '<div>v1</div>',
          htmlContentTo: '<div>v2</div>',
        }),
      });

      const { visualizations } = require('../lib/api');
      const result = await visualizations.compareVersions(1, 1, 2);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/visualizations/1/versions/compare',
        expect.objectContaining({ method: 'POST' }),
      );
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.fromVersionId).toBe(1);
      expect(body.toVersionId).toBe(2);
      expect(result.from.version).toBe(1);
      expect(result.to.version).toBe(2);
    });

    // ── Topic Suggestions ──

    it('visualizations.suggestTopics fetches topic suggestions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'pythagorean', title: 'Pythagorean Theorem', subject: 'math' },
          { id: 'pendulum', title: 'Pendulum', subject: 'physics' },
        ],
      });

      const { visualizations } = require('../lib/api');
      const result = await visualizations.suggestTopics({ subject: 'math', count: 5 });

      expect(mockFetch.mock.calls[0][0]).toContain('/visualizations/topics/suggest');
      expect(mockFetch.mock.calls[0][0]).toContain('subject=math');
      expect(mockFetch.mock.calls[0][0]).toContain('count=5');
      expect(result).toHaveLength(2);
    });

    it('visualizations.suggestTopics works without params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'pythagorean', title: 'Pythagorean Theorem', subject: 'math' }],
      });

      const { visualizations } = require('../lib/api');
      const result = await visualizations.suggestTopics();

      expect(mockFetch.mock.calls[0][0]).toBe('/api/visualizations/topics/suggest');
      expect(result).toHaveLength(1);
    });
  });
});
