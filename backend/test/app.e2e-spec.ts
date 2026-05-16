import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';
import { VisualizationAiService } from '../src/visualization/visualization-ai.service';
import * as jwt from 'jsonwebtoken';

describe('Blog API (e2e)', () => {
  let app: INestApplication;
  const authToken = jwt.sign(
    { sub: 1, username: 'admin', role: 'admin' },
    process.env.JWT_SECRET || 'blog-jwt-secret-key-change-in-production',
    { expiresIn: '1h' },
  );
  const authHeader = { Authorization: `Bearer ${authToken}` };

  const mockPrisma = {
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    post: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 1 }),
      update: jest.fn().mockResolvedValue({ id: 1 }),
      delete: jest.fn().mockResolvedValue({ id: 1 }),
      aggregate: jest.fn().mockResolvedValue({ _sum: { viewCount: 0 } }),
    },
    user: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 1 }),
      update: jest.fn().mockResolvedValue({ id: 1 }),
      delete: jest.fn().mockResolvedValue({ id: 1 }),
    },
    category: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 1, name: 'Test', slug: 'test' }),
      update: jest.fn().mockResolvedValue({ id: 1 }),
      delete: jest.fn().mockResolvedValue({ id: 1 }),
    },
    tag: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 1, name: 'Test', slug: 'test' }),
      update: jest.fn().mockResolvedValue({ id: 1 }),
      delete: jest.fn().mockResolvedValue({ id: 1 }),
    },
    comment: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 1 }),
      update: jest.fn().mockResolvedValue({ id: 1 }),
      delete: jest.fn().mockResolvedValue({ id: 1 }),
    },
    media: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 1 }),
      delete: jest.fn().mockResolvedValue({ id: 1 }),
    },
    crawlSource: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 1, name: 'Source', url: 'https://example.com', interval: 60 }),
      create: jest.fn().mockResolvedValue({ id: 1 }),
      update: jest.fn().mockResolvedValue({ id: 1 }),
      delete: jest.fn().mockResolvedValue({ id: 1 }),
    },
    crawledArticle: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 1, title: 'Article' }),
      create: jest.fn().mockResolvedValue({ id: 1 }),
      delete: jest.fn().mockResolvedValue({ id: 1 }),
      update: jest.fn().mockResolvedValue({ id: 1 }),
    },
    chatMessage: {
      create: jest.fn().mockResolvedValue({ id: 1 }),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    feedback: {
      create: jest.fn().mockResolvedValue({ id: 1 }),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn().mockResolvedValue({ id: 1, isRead: true }),
    },
    banner: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 1 }),
      update: jest.fn().mockResolvedValue({ id: 1 }),
      delete: jest.fn().mockResolvedValue({ id: 1 }),
    },
    postTag: {
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    visualization: {
      create: jest.fn().mockResolvedValue({ id: 1, title: 'Test Viz', subject: 'math', introduction: 'Brief intro', detailedExplanation: 'Detailed explanation content', knowledgeSummary: 'Point 1\nPoint 2', htmlContent: '<div>viz</div>', status: 'draft', version: 1, viewCount: 0, interactCount: 0, authorId: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockImplementation((args) =>
        args.where.id === 999 ? null : { id: 1, title: 'Test Viz', subject: 'math', htmlContent: '<div>viz</div>', description: '', introduction: 'Brief intro about the visualization', detailedExplanation: 'This is a detailed explanation with multiple paragraphs.\n\nIt covers the underlying concepts.', knowledgeSummary: 'Key concept 1\nKey concept 2\nKey concept 3', tags: '', prompt: 'test prompt', status: 'draft', version: 1, viewCount: 5, interactCount: 2, likesCount: 10, authorId: 1, author: { id: 1, username: 'admin', displayName: 'Admin' }, versions: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ),
      findUniqueOrThrow: jest.fn().mockImplementation((args) => {
        if (args?.where?.id === 999) throw new Error('Not found');
        return { id: 1, title: 'Test Viz', subject: 'math', htmlContent: '<div>viz</div>', description: '', introduction: 'Brief intro about the visualization', detailedExplanation: 'This is a detailed explanation with multiple paragraphs.\n\nIt covers the underlying concepts.', knowledgeSummary: 'Key concept 1\nKey concept 2\nKey concept 3', tags: '', prompt: 'test prompt', status: 'draft', version: 1, viewCount: 5, interactCount: 2, likesCount: 10, authorId: 1, author: { id: 1, username: 'admin', displayName: 'Admin' }, versions: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      }),
      findFirst: jest.fn().mockImplementation((args) =>
        args?.where?.id === 999 ? null : { id: 1, title: 'Test Viz', subject: 'math', htmlContent: '<div>viz</div>', description: '', introduction: 'Brief intro', detailedExplanation: 'Detailed explanation', knowledgeSummary: 'Point 1\nPoint 2', tags: '', prompt: 'test prompt', status: 'draft', version: 1, viewCount: 5, interactCount: 2, likesCount: 10, authorId: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ),
      update: jest.fn().mockResolvedValue({ id: 1 }),
      delete: jest.fn().mockResolvedValue({ id: 1 }),
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue({ _sum: { viewCount: 0, interactCount: 0 } }),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    visualizationVersion: {
      create: jest.fn().mockResolvedValue({ id: 1 }),
    },
    visualizationStat: {
      create: jest.fn().mockResolvedValue({ id: 1 }),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    visualizationLike: {
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 1, visualizationId: 1, userId: 1 }),
      delete: jest.fn().mockResolvedValue({ id: 1 }),
    },
    visualizationComment: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 1, content: 'Great viz!', visualizationId: 1, authorId: 1, parentId: null, author: { id: 1, username: 'admin', displayName: 'Admin' }, createdAt: new Date().toISOString() }),
      delete: jest.fn().mockResolvedValue({ id: 1 }),
    },
    errorLog: {
      create: jest.fn().mockResolvedValue({ id: 1 }),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockImplementation((args) =>
        args.where.id === 999 ? null : { id: 1, method: 'GET', url: '/api/test', statusCode: 500, message: 'Test error', stack: '', body: '', userId: null, createdAt: new Date().toISOString() },
      ),
      count: jest.fn().mockResolvedValue(0),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    siteConfig: {
      findFirst: jest.fn().mockImplementation((args) =>
        args?.where?.id === 999 ? null : { id: 1, siteTitle: 'AI Blog', siteTagline: '', siteDescription: '', adminTitle: 'Blog Admin', logoUrl: '', faviconUrl: '', footerText: '', copyrightText: '', contactEmail: '', socialLinks: '{}', seoHomeTitle: '', seoHomeDescription: '', postsPerPage: 10, enableComments: true, customHeadHtml: '', privacyPolicyContent: '', termsOfUseContent: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ),
      create: jest.fn().mockImplementation((args) => ({ id: 1, ...args.data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })),
      update: jest.fn().mockImplementation((args) => ({ id: 1, ...args.data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })),
    },
    aiUsageLog: {
      create: jest.fn().mockResolvedValue({ id: 1, provider: 'deepseek', model: 'deepseek-chat', feature: 'test', promptTokens: 10, completionTokens: 5, totalTokens: 15, durationMs: 100, status: 'success', createdAt: new Date().toISOString() }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue({
        _sum: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        _count: { id: 5 },
      }),
      groupBy: jest.fn().mockResolvedValue([
        { provider: 'deepseek', _count: { id: 3 }, _sum: { promptTokens: 60, completionTokens: 30, totalTokens: 90 } },
        { provider: 'gemini', _count: { id: 2 }, _sum: { promptTokens: 40, completionTokens: 20, totalTokens: 60 } },
      ]),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health', () => {
    it('GET /api/health should return healthy status', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect(res => {
          expect(res.body.status).toBe('healthy');
          expect(res.body.database).toBe('connected');
        });
    });
  });

  describe('Categories', () => {
    it('GET /api/categories should return a list', () => {
      return request(app.getHttpServer())
        .get('/api/categories')
        .expect(200)
        .expect([]);
    });

    it('GET /api/categories/:id should return 404 for missing category', () => {
      return request(app.getHttpServer())
        .get('/api/categories/999')
        .expect(404);
    });

    it('POST /api/categories (no auth) should return 401', () => {
      return request(app.getHttpServer())
        .post('/api/categories')
        .send({ name: 'New Category' })
        .expect(401);
    });
  });

  describe('Posts', () => {
    it('GET /api/posts should return paginated posts', () => {
      return request(app.getHttpServer())
        .get('/api/posts')
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
        });
    });

    it('GET /api/posts/999 should return 404', () => {
      return request(app.getHttpServer())
        .get('/api/posts/999')
        .expect(404);
    });
  });

  describe('Tags', () => {
    it('GET /api/tags should return a list', () => {
      return request(app.getHttpServer())
        .get('/api/tags')
        .expect(200);
    });
  });

  describe('Auth', () => {
    it('POST /api/auth/register should validate input', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({})
        .expect(400);
    });

    it('POST /api/auth/login should validate input', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('Comments', () => {
    it('GET /api/comments/post/:postId should return comments', () => {
      return request(app.getHttpServer())
        .get('/api/comments/post/1')
        .expect(200);
    });
  });

  describe('Visualizations', () => {
    it('GET /api/visualizations/published should return published list', () => {
      return request(app.getHttpServer())
        .get('/api/visualizations/published')
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
        });
    });

    it('GET /api/visualizations should return all (auth-protected)', () => {
      return request(app.getHttpServer())
        .get('/api/visualizations')
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
        });
    });

    it('GET /api/visualizations/:id should return a visualization', () => {
      return request(app.getHttpServer())
        .get('/api/visualizations/1')
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('title');
          expect(res.body.subject).toBe('math');
        });
    });

    it('GET /api/visualizations/999 should return 404', () => {
      return request(app.getHttpServer())
        .get('/api/visualizations/999')
        .expect(404);
    });

    it('POST /api/visualizations/:id/stats should record a stat event', () => {
      return request(app.getHttpServer())
        .post('/api/visualizations/1/stats')
        .send({ action: 'view' })
        .expect(201);
    });

    it('POST /api/visualizations (no auth) should return 401', () => {
      return request(app.getHttpServer())
        .post('/api/visualizations')
        .send({ title: 'Test', subject: 'math', htmlContent: '<div>fn()</div>' })
        .expect(401);
    });

    it('POST /api/visualizations/generate (no auth) should return 401', () => {
      return request(app.getHttpServer())
        .post('/api/visualizations/generate')
        .send({ prompt: 'test', subject: 'math' })
        .expect(401);
    });

    it('POST /api/visualizations/refine (no auth) should return 401', () => {
      return request(app.getHttpServer())
        .post('/api/visualizations/refine')
        .send({ visualizationId: 1, feedback: 'fix' })
        .expect(401);
    });

    it('GET /api/visualizations/providers (no auth) should return 401', () => {
      return request(app.getHttpServer())
        .get('/api/visualizations/providers')
        .expect(401);
    });

    it('PUT /api/visualizations/:id (no auth) should return 401', () => {
      return request(app.getHttpServer())
        .put('/api/visualizations/1')
        .send({ title: 'Hacked' })
        .expect(401);
    });

    it('DELETE /api/visualizations/:id (no auth) should return 401', () => {
      return request(app.getHttpServer())
        .delete('/api/visualizations/1')
        .expect(401);
    });

    it('GET /api/visualizations/:id/stats (no auth) should return 401', () => {
      return request(app.getHttpServer())
        .get('/api/visualizations/1/stats')
        .expect(401);
    });

    it('GET /api/visualizations/stats/aggregated (no auth) should return 401', () => {
      return request(app.getHttpServer())
        .get('/api/visualizations/stats/aggregated')
        .expect(401);
    });

    // ── Likes ──

    it('POST /api/visualizations/:id/like (no auth) should return 401', () => {
      return request(app.getHttpServer())
        .post('/api/visualizations/1/like')
        .expect(401);
    });

    it('POST /api/visualizations/:id/like should toggle like on', () => {
      return request(app.getHttpServer())
        .post('/api/visualizations/1/like')
        .set(authHeader)
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('liked');
          expect(res.body).toHaveProperty('likesCount');
          expect(res.body.liked).toBe(true);
        });
    });

    it('GET /api/visualizations/:id/like-status (no auth) should return 401', () => {
      return request(app.getHttpServer())
        .get('/api/visualizations/1/like-status')
        .expect(401);
    });

    it('GET /api/visualizations/:id/like-status should return current status', () => {
      // Mock already returns visualizationLike.findUnique as null => liked: false
      return request(app.getHttpServer())
        .get('/api/visualizations/1/like-status')
        .set(authHeader)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('liked');
          expect(res.body).toHaveProperty('likesCount');
        });
    });

    // ── Comments ──

    it('GET /api/visualizations/:id/comments should return comments list', () => {
      return request(app.getHttpServer())
        .get('/api/visualizations/1/comments')
        .expect(200)
        .expect([]);
    });

    it('POST /api/visualizations/:id/comments (no auth) should return 401', () => {
      return request(app.getHttpServer())
        .post('/api/visualizations/1/comments')
        .send({ content: 'Nice work!' })
        .expect(401);
    });

    it('POST /api/visualizations/:id/comments should create a comment', () => {
      mockPrisma.visualizationComment.findMany = jest.fn().mockResolvedValueOnce([
        { id: 1, content: 'Great viz!', visualizationId: 1, authorId: 1, parentId: null, author: { id: 1, username: 'admin', displayName: 'Admin' }, createdAt: new Date().toISOString(), replies: [] },
      ]);
      return request(app.getHttpServer())
        .post('/api/visualizations/1/comments')
        .set(authHeader)
        .send({ content: 'Great viz!' })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('content');
        });
    });

    it('POST /api/visualizations/:id/comments (no auth) should return 401 for empty content too', () => {
      return request(app.getHttpServer())
        .post('/api/visualizations/1/comments')
        .send({ content: '' })
        .expect(401);
    });

    it('DELETE /api/visualizations/comments/:commentId (no auth) should return 401', () => {
      return request(app.getHttpServer())
        .delete('/api/visualizations/comments/1')
        .expect(401);
    });

    it('DELETE /api/visualizations/comments/:commentId should delete a comment', () => {
      mockPrisma.visualizationComment.findUnique = jest.fn().mockResolvedValueOnce({ id: 1, authorId: 1 });
      return request(app.getHttpServer())
        .delete('/api/visualizations/comments/1')
        .set(authHeader)
        .expect(200);
    });

    // ── Related ──

    it('GET /api/visualizations/:id/related should return related visualizations', () => {
      return request(app.getHttpServer())
        .get('/api/visualizations/1/related')
        .expect(200)
        .expect([]);
    });

    // ── Metadata ──

    it('GET /api/visualizations/:id should include introduction, detailedExplanation, knowledgeSummary', () => {
      return request(app.getHttpServer())
        .get('/api/visualizations/1')
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('introduction');
          expect(res.body).toHaveProperty('detailedExplanation');
          expect(res.body).toHaveProperty('knowledgeSummary');
          expect(typeof res.body.introduction).toBe('string');
          expect(typeof res.body.detailedExplanation).toBe('string');
          expect(typeof res.body.knowledgeSummary).toBe('string');
        });
    });

    it('PUT /api/visualizations/:id should update metadata fields', () => {
      return request(app.getHttpServer())
        .put('/api/visualizations/1')
        .set(authHeader)
        .send({ introduction: 'Updated intro', detailedExplanation: 'Updated detailed explanation', knowledgeSummary: 'Updated point 1\nUpdated point 2' })
        .expect(200);
    });

    it('POST /api/visualizations (create) should accept metadata fields', () => {
      return request(app.getHttpServer())
        .post('/api/visualizations')
        .set(authHeader)
        .send({ title: 'New Viz', subject: 'physics', htmlContent: '<div>test</div>', introduction: 'My intro', detailedExplanation: 'My detailed explanation', knowledgeSummary: 'Point 1\nPoint 2', prompt: 'test prompt' })
        .expect(201);
    });

    // ── Streaming ──

    it('POST /api/visualizations/generate-stream (no auth) should return 401', () => {
      return request(app.getHttpServer())
        .post('/api/visualizations/generate-stream')
        .send({ prompt: 'test', subject: 'math' })
        .expect(401);
    });

    it('POST /api/visualizations/generate-stream should stream SSE events', async () => {
      const mockStream = (async function* (): AsyncGenerator<{ type: 'text'; text: string }, void, undefined> {
        yield { type: 'text' as const, text: '<div class="viz-root">' };
        yield { type: 'text' as const, text: 'Hello World' };
        yield { type: 'text' as const, text: '</div>' };
      })();

      const aiService = app.get(VisualizationAiService);
      jest.spyOn(aiService, 'generateStream').mockResolvedValue(mockStream);

      const res = await request(app.getHttpServer())
        .post('/api/visualizations/generate-stream')
        .set(authHeader)
        .send({ prompt: 'Pythagorean theorem', subject: 'math' })
        .buffer(true)
        .parse((_res: any, cb: any) => {
          let data = '';
          _res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
          _res.on('end', () => cb(null, data as any));
        });

      expect(res.status).toBe(200);
      const body = res.body as string;
      expect(body).toContain('event: init');
      expect(body).toContain('event: chunk');
      expect(body).toContain('event: done');
      expect(body).toContain('"id":1');

      jest.restoreAllMocks();
    });
  });

  describe('Error Logs', () => {
    it('GET /api/logs (no auth) should return 401', () => {
      return request(app.getHttpServer())
        .get('/api/logs')
        .expect(401);
    });

    it('GET /api/logs should return paginated logs', () => {
      return request(app.getHttpServer())
        .get('/api/logs')
        .set(authHeader)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('totalPages');
        });
    });

    it('GET /api/logs?method=GET should filter by method', () => {
      return request(app.getHttpServer())
        .get('/api/logs?method=GET')
        .set(authHeader)
        .expect(200);
    });

    it('GET /api/logs?statusCode=404 should filter by status code', () => {
      return request(app.getHttpServer())
        .get('/api/logs?statusCode=404')
        .set(authHeader)
        .expect(200);
    });

    it('GET /api/logs?search=error should search logs', () => {
      return request(app.getHttpServer())
        .get('/api/logs?search=error')
        .set(authHeader)
        .expect(200);
    });

    it('GET /api/logs?page=1&limit=10 should paginate', () => {
      return request(app.getHttpServer())
        .get('/api/logs?page=1&limit=10')
        .set(authHeader)
        .expect(200)
        .expect(res => {
          expect(res.body.page).toBe(1);
          expect(res.body.limit).toBe(10);
        });
    });

    it('GET /api/logs/stats should return aggregated statistics', () => {
      return request(app.getHttpServer())
        .get('/api/logs/stats')
        .set(authHeader)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('overview');
          expect(res.body).toHaveProperty('statusCodeDistribution');
          expect(res.body).toHaveProperty('topEndpoints');
          expect(res.body).toHaveProperty('timeline');
        });
    });

    it('GET /api/logs/:id should return a single log entry', () => {
      return request(app.getHttpServer())
        .get('/api/logs/1')
        .set(authHeader)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('method');
          expect(res.body).toHaveProperty('url');
          expect(res.body).toHaveProperty('statusCode');
          expect(res.body).toHaveProperty('message');
        });
    });

    it('GET /api/logs/999 should return 404 for missing log', () => {
      return request(app.getHttpServer())
        .get('/api/logs/999')
        .set(authHeader)
        .expect(404);
    });

    it('DELETE /api/logs should clear all logs', () => {
      return request(app.getHttpServer())
        .delete('/api/logs')
        .set(authHeader)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('GET /api/logs (no auth) should return 401 for DELETE too', () => {
      return request(app.getHttpServer())
        .delete('/api/logs')
        .expect(401);
    });
  });

  describe('Site Config', () => {
    it('GET /api/site-config should return site configuration', () => {
      return request(app.getHttpServer())
        .get('/api/site-config')
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('siteTitle');
          expect(res.body).toHaveProperty('adminTitle');
          expect(res.body).toHaveProperty('postsPerPage');
          expect(res.body).toHaveProperty('enableComments');
        });
    });

    it('PUT /api/site-config (no auth) should return 401', () => {
      return request(app.getHttpServer())
        .put('/api/site-config')
        .send({ siteTitle: 'Updated Blog' })
        .expect(401);
    });

    it('PUT /api/site-config should update configuration', () => {
      return request(app.getHttpServer())
        .put('/api/site-config')
        .set(authHeader)
        .send({
          siteTitle: 'My Updated Blog',
          siteTagline: 'A better tagline',
          siteDescription: 'Updated site description',
          adminTitle: 'Admin Panel',
          postsPerPage: 20,
          enableComments: false,
        })
        .expect(200)
        .expect(res => {
          expect(res.body.siteTitle).toBe('My Updated Blog');
          expect(res.body.siteTagline).toBe('A better tagline');
          expect(res.body.siteDescription).toBe('Updated site description');
          expect(res.body.adminTitle).toBe('Admin Panel');
          expect(res.body.postsPerPage).toBe(20);
          expect(res.body.enableComments).toBe(false);
        });
    });

    it('PUT /api/site-config should validate input', () => {
      return request(app.getHttpServer())
        .put('/api/site-config')
        .set(authHeader)
        .send({ siteTitle: 123 })
        .expect(400);
    });

    it('PUT /api/site-config should accept partial updates', () => {
      return request(app.getHttpServer())
        .put('/api/site-config')
        .set(authHeader)
        .send({ footerText: 'Custom footer' })
        .expect(200)
        .expect(res => {
          expect(res.body.footerText).toBe('Custom footer');
        });
    });

    it('GET /api/site-config should include privacy and terms fields', () => {
      return request(app.getHttpServer())
        .get('/api/site-config')
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('privacyPolicyContent');
          expect(res.body).toHaveProperty('termsOfUseContent');
        });
    });

    it('PUT /api/site-config should update privacyPolicyContent', () => {
      return request(app.getHttpServer())
        .put('/api/site-config')
        .set(authHeader)
        .send({ privacyPolicyContent: '# Privacy Policy\n\nWe respect your privacy.' })
        .expect(200)
        .expect(res => {
          expect(res.body.privacyPolicyContent).toBe('# Privacy Policy\n\nWe respect your privacy.');
        });
    });

    it('PUT /api/site-config should update termsOfUseContent', () => {
      return request(app.getHttpServer())
        .put('/api/site-config')
        .set(authHeader)
        .send({ termsOfUseContent: '# Terms of Use\n\nBy using this site you agree...' })
        .expect(200)
        .expect(res => {
          expect(res.body.termsOfUseContent).toBe('# Terms of Use\n\nBy using this site you agree...');
        });
    });

    it('PUT /api/site-config should accept markdown content in both legal fields', () => {
      const markdown = `# Heading 1\n\n## Heading 2\n\n- List item 1\n- List item 2\n\n**bold** and *italic*`;
      return request(app.getHttpServer())
        .put('/api/site-config')
        .set(authHeader)
        .send({ privacyPolicyContent: markdown, termsOfUseContent: markdown })
        .expect(200)
        .expect(res => {
          expect(res.body.privacyPolicyContent).toContain('Heading 1');
          expect(res.body.privacyPolicyContent).toContain('**bold**');
          expect(res.body.termsOfUseContent).toContain('Heading 1');
          expect(res.body.termsOfUseContent).toContain('List item 1');
        });
    });
  });

  describe('AI Usage', () => {
    it('GET /api/ai-usage (no auth) should return 401', () => {
      return request(app.getHttpServer())
        .get('/api/ai-usage')
        .expect(401);
    });

    it('GET /api/ai-usage should return paginated records', () => {
      return request(app.getHttpServer())
        .get('/api/ai-usage')
        .set(authHeader)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('limit');
          expect(res.body).toHaveProperty('totalPages');
        });
    });

    it('GET /api/ai-usage/stats (no auth) should return 401', () => {
      return request(app.getHttpServer())
        .get('/api/ai-usage/stats')
        .expect(401);
    });

    it('GET /api/ai-usage/stats should return aggregated stats', () => {
      return request(app.getHttpServer())
        .get('/api/ai-usage/stats')
        .set(authHeader)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('summary');
          expect(res.body).toHaveProperty('byProvider');
          expect(res.body.summary).toHaveProperty('totalCalls');
          expect(res.body.summary).toHaveProperty('totalTokens');
          expect(res.body.byProvider).toBeInstanceOf(Array);
        });
    });

    it('GET /api/ai-usage?provider=deepseek should filter by provider', () => {
      return request(app.getHttpServer())
        .get('/api/ai-usage?provider=deepseek')
        .set(authHeader)
        .expect(200);
    });
  });

  describe('404 handling', () => {
    it('GET /api/nonexistent should return 404', () => {
      return request(app.getHttpServer())
        .get('/api/nonexistent')
        .expect(404);
    });
  });
});
