import { SafeUser } from '../auth/auth.service';

declare global {
  namespace Express {
    interface User extends SafeUser {}
  }
}
