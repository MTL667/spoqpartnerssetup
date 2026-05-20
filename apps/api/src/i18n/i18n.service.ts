import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const SUPPORTED_LOCALES = ['nl', 'en'] as const;
type Locale = typeof SUPPORTED_LOCALES[number];
const DEFAULT_LOCALE: Locale = 'nl';

const TRANSLATIONS: Record<Locale, Record<string, string>> = {
  nl: {
    'task.activated': 'Taak geactiveerd',
    'task.overdue': 'Taak te laat',
    'task.completed': 'Taak afgerond',
    'deadline.approaching': 'Deadline nadert',
    'welcome.message': 'Welkom bij SPOQ Partner Portal',
    'phase.preparation': 'Voorbereiding',
    'phase.technical_setup': 'Technische Setup',
    'phase.content_marketing': 'Content & Marketing',
    'phase.go_to_market': 'Go-to-Market',
    'phase.post_launch': 'Na lancering',
    'notification.mention': 'Je bent getagd in een opmerking',
    'notification.deliverable': 'Nieuw bestand geüpload',
    'error.not_found': 'Niet gevonden',
    'error.forbidden': 'Geen toegang',
  },
  en: {
    'task.activated': 'Task activated',
    'task.overdue': 'Task overdue',
    'task.completed': 'Task completed',
    'deadline.approaching': 'Deadline approaching',
    'welcome.message': 'Welcome to SPOQ Partner Portal',
    'phase.preparation': 'Preparation',
    'phase.technical_setup': 'Technical Setup',
    'phase.content_marketing': 'Content & Marketing',
    'phase.go_to_market': 'Go-to-Market',
    'phase.post_launch': 'Post-Launch',
    'notification.mention': 'You were tagged in a comment',
    'notification.deliverable': 'New file uploaded',
    'error.not_found': 'Not found',
    'error.forbidden': 'Access denied',
  },
};

@Injectable()
export class I18nService {
  constructor(private prisma: PrismaService) {}

  translate(key: string, locale: string): string {
    const resolvedLocale = this.resolveLocale(locale);
    return TRANSLATIONS[resolvedLocale]?.[key] ?? TRANSLATIONS[DEFAULT_LOCALE][key] ?? key;
  }

  resolveLocale(locale: string): Locale {
    if (SUPPORTED_LOCALES.includes(locale as Locale)) {
      return locale as Locale;
    }
    return DEFAULT_LOCALE;
  }

  getSupportedLocales() {
    return [...SUPPORTED_LOCALES];
  }

  async updateUserLocale(userId: string, locale: string) {
    const resolved = this.resolveLocale(locale);
    if (locale !== resolved && locale !== 'nl' && locale !== 'en') {
      throw new BadRequestException(`Unsupported locale "${locale}". Supported: ${SUPPORTED_LOCALES.join(', ')}`);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { locale: resolved },
      select: { id: true, locale: true },
    });
  }

  getTranslations(locale: string): Record<string, string> {
    const resolved = this.resolveLocale(locale);
    return { ...TRANSLATIONS[resolved] };
  }
}
