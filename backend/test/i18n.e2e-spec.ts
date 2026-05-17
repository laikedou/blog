import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

describe('i18n (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({}) // minimal mock — i18n doesn't use Prisma
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/i18n/detect', () => {
    it('should return detected locale and supported locales', () => {
      return request(app.getHttpServer())
        .get('/api/i18n/detect')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('locale');
          expect(res.body).toHaveProperty('supportedLocales');
          expect(Array.isArray(res.body.supportedLocales)).toBe(true);
          expect(res.body.supportedLocales).toContain('zh-CN');
          expect(res.body.supportedLocales).toContain('zh-TW');
          expect(res.body.supportedLocales).toContain('en');
          expect(res.body.supportedLocales).toContain('ja');
        });
    });

    it('should respect Accept-Language header', () => {
      return request(app.getHttpServer())
        .get('/api/i18n/detect')
        .set('Accept-Language', 'ja')
        .expect(200)
        .expect((res) => {
          expect(res.body.locale).toBe('ja');
        });
    });

    it('should respect zh-CN Accept-Language header', () => {
      return request(app.getHttpServer())
        .get('/api/i18n/detect')
        .set('Accept-Language', 'zh-CN')
        .expect(200)
        .expect((res) => {
          expect(res.body.locale).toBe('zh-CN');
        });
    });

    it('should respect zh-TW Accept-Language header', () => {
      return request(app.getHttpServer())
        .get('/api/i18n/detect')
        .set('Accept-Language', 'zh-TW')
        .expect(200)
        .expect((res) => {
          expect(res.body.locale).toBe('zh-TW');
        });
    });

    it('should respect en-US Accept-Language header', () => {
      return request(app.getHttpServer())
        .get('/api/i18n/detect')
        .set('Accept-Language', 'en-US')
        .expect(200)
        .expect((res) => {
          expect(res.body.locale).toBe('en');
        });
    });

    it('should return a default locale for unknown languages', () => {
      return request(app.getHttpServer())
        .get('/api/i18n/detect')
        .set('Accept-Language', 'fr')
        .expect(200)
        .expect((res) => {
          expect(typeof res.body.locale).toBe('string');
        });
    });
  });
});
