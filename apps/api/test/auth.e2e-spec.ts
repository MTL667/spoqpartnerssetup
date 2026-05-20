import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as session from 'express-session';
import * as passport from 'passport';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { httpOnly: true, secure: false, sameSite: 'lax' },
      }),
    );
    app.use(passport.initialize());
    app.use(passport.session());
    app.setGlobalPrefix('api');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/login', () => {
    it('returns 401 for invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nonexistent@spoq.nl', password: 'wrong' })
        .expect(401);
    });

    it('returns 401 for wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@spoq.nl', password: 'wrongpassword' })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });
  });

  describe('Protected routes', () => {
    it('returns 401 for unauthenticated request to any protected route', async () => {
      await request(app.getHttpServer())
        .get('/api/any-protected-route')
        .expect(401);
    });
  });
});
