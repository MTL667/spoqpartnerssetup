import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import session from 'express-session';
import passport from 'passport';
import { RedisStore } from 'connect-redis';
import { Redis } from 'ioredis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  const sessionTimeoutMinutes = parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30', 10);

  app.use(
    session({
      store: new RedisStore({ client: redisClient }),
      secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: sessionTimeoutMinutes * 60 * 1000,
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const port = process.env.API_PORT || 3000;
  await app.listen(port);
  console.log(`SPOQ API running on port ${port}`);
}

bootstrap();
