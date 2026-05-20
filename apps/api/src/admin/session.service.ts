import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class SessionService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async destroyUserSessions(userId: string): Promise<number> {
    let destroyed = 0;
    let cursor = '0';

    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        'sess:*',
        'COUNT',
        100,
      );
      cursor = nextCursor;

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (!data) continue;
        try {
          const session = JSON.parse(data);
          if (session?.passport?.user?.userId === userId) {
            await this.redis.del(key);
            destroyed++;
          }
        } catch {
          continue;
        }
      }
    } while (cursor !== '0');

    return destroyed;
  }
}
