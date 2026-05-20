import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './local.strategy';
import { SessionSerializer } from './session.serializer';
import { BootstrapService } from './bootstrap.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule, PassportModule.register({ session: true })],
  providers: [AuthService, LocalStrategy, SessionSerializer, BootstrapService],
  controllers: [AuthController],
})
export class AuthModule {}
