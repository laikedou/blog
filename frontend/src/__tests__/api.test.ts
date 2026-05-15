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
});
