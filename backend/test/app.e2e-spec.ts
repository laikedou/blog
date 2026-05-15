import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

describe('Blog API (e2e)', () => {
  let app: INestApplication;

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

  describe('404 handling', () => {
    it('GET /api/nonexistent should return 404', () => {
      return request(app.getHttpServer())
        .get('/api/nonexistent')
        .expect(404);
    });
  });
});
