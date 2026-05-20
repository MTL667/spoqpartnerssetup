import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { I18nService } from './i18n.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SafeUser } from '../auth/auth.service';

@Controller('i18n')
export class I18nController {
  constructor(private i18nService: I18nService) {}

  @Get('locales')
  getSupportedLocales() {
    return { locales: this.i18nService.getSupportedLocales() };
  }

  @Get('translations/:locale')
  getTranslations(@Param('locale') locale: string) {
    return this.i18nService.getTranslations(locale);
  }

  @Patch('locale')
  async updateLocale(@Body() body: { locale: string }, @CurrentUser() user: SafeUser) {
    return this.i18nService.updateUserLocale(user.id, body.locale);
  }
}
