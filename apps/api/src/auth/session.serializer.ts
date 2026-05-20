import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { UsersService } from '../users/users.service';
import { SafeUser } from './auth.service';

interface SessionPayload {
  userId: string;
  role: string;
  partnerId: string | null;
}

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private usersService: UsersService) {
    super();
  }

  serializeUser(user: SafeUser, done: (err: Error | null, payload?: SessionPayload) => void) {
    done(null, {
      userId: user.id,
      role: user.role,
      partnerId: user.partnerId,
    });
  }

  async deserializeUser(
    payload: SessionPayload,
    done: (err: Error | null, user?: SafeUser | null) => void,
  ) {
    const user = await this.usersService.findById(payload.userId);
    if (!user) return done(null, null);

    const { passwordHash: _, ...safe } = user;
    done(null, safe);
  }
}
