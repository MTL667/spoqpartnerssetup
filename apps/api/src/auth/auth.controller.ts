import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthService, SafeUser } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@CurrentUser() user: SafeUser) {
    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return new Promise<{ message: string }>((resolve, reject) => {
      req.logout((err) => {
        if (err) return reject(err);
        req.session.destroy((sessionErr) => {
          if (sessionErr) return reject(sessionErr);
          res.clearCookie('connect.sid');
          resolve({ message: 'Logged out' });
        });
      });
    });
  }

  @Get('me')
  async me(@CurrentUser() user: SafeUser) {
    const profile = await this.authService.getUserProfile(user.id);
    if (!profile) {
      throw new UnauthorizedException();
    }
    return profile;
  }

  @Public()
  @Get('setup-check')
  async setupCheck() {
    return this.authService.getSetupStatus();
  }

  @Public()
  @Post('setup')
  @HttpCode(HttpStatus.OK)
  async setup(@Body() body: { email: string; password: string }, @Req() req: Request) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email en wachtwoord zijn verplicht');
    }
    if (body.password.length < 8) {
      throw new BadRequestException('Wachtwoord moet minimaal 8 tekens zijn');
    }
    const user = await this.authService.completeSetup(body.email, body.password);

    return new Promise<SafeUser>((resolve, reject) => {
      req.login(user, (err) => {
        if (err) return reject(err);
        resolve(user);
      });
    });
  }
}
