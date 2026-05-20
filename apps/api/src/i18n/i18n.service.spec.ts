import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { I18nService } from './i18n.service';
import { PrismaService } from '../prisma/prisma.service';

describe('I18nService', () => {
  let service: I18nService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: { update: jest.fn().mockResolvedValue({ id: 'u1', locale: 'en' }) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        I18nService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<I18nService>(I18nService);
  });

  describe('translate', () => {
    it('returns Dutch translation by default', () => {
      expect(service.translate('task.activated', 'nl')).toBe('Taak geactiveerd');
    });

    it('returns English translation', () => {
      expect(service.translate('task.activated', 'en')).toBe('Task activated');
    });

    it('falls back to Dutch for unsupported locale', () => {
      expect(service.translate('task.activated', 'fr')).toBe('Taak geactiveerd');
    });

    it('returns key when translation not found', () => {
      expect(service.translate('nonexistent.key', 'nl')).toBe('nonexistent.key');
    });
  });

  describe('resolveLocale', () => {
    it('returns nl for supported locale', () => {
      expect(service.resolveLocale('nl')).toBe('nl');
    });

    it('returns en for supported locale', () => {
      expect(service.resolveLocale('en')).toBe('en');
    });

    it('falls back to nl for unsupported locale', () => {
      expect(service.resolveLocale('de')).toBe('nl');
    });
  });

  describe('getSupportedLocales', () => {
    it('returns nl and en', () => {
      const locales = service.getSupportedLocales();
      expect(locales).toContain('nl');
      expect(locales).toContain('en');
      expect(locales).toHaveLength(2);
    });
  });

  describe('updateUserLocale', () => {
    it('updates user locale', async () => {
      const result = await service.updateUserLocale('u1', 'en');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { locale: 'en' },
        select: { id: true, locale: true },
      });
    });

    it('throws for unsupported locale', async () => {
      await expect(service.updateUserLocale('u1', 'de')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTranslations', () => {
    it('returns all translations for locale', () => {
      const translations = service.getTranslations('en');
      expect(translations['task.activated']).toBe('Task activated');
      expect(translations['welcome.message']).toBe('Welcome to SPOQ Partner Portal');
    });
  });
});
