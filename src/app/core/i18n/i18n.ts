import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import localeUz from '@angular/common/locales/uz';
import { Injectable, computed, signal } from '@angular/core';
import { TranslationKey, Translations, en } from './en';
import { ru } from './ru';
import { uz } from './uz';

export type Lang = 'ru' | 'uz' | 'en';

export interface LanguageOption {
  code: Lang;
  /** Shown in the switcher, always in its own language. */
  label: string;
  /** Angular locale id used by the date and number pipes. */
  locale: string;
}

export const LANGUAGES: readonly LanguageOption[] = [
  { code: 'ru', label: 'Русский', locale: 'ru' },
  { code: 'uz', label: "O'zbekcha", locale: 'uz' },
  { code: 'en', label: 'English', locale: 'en-US' },
];

const DICTIONARIES: Record<Lang, Translations> = { ru, uz, en };
const STORAGE_KEY = 'badem.lang';
const DEFAULT_LANG: Lang = 'ru';

// Month names and number formats for the pipes; 'en-US' ships with Angular.
registerLocaleData(localeRu, 'ru');
registerLocaleData(localeUz, 'uz');

export type TranslateParams = Record<string, string | number>;

@Injectable({ providedIn: 'root' })
export class I18n {
  readonly lang = signal<Lang>(initialLang());

  readonly locale = computed(
    () => LANGUAGES.find((l) => l.code === this.lang())?.locale ?? 'ru',
  );

  readonly languages = LANGUAGES;

  private readonly dictionary = computed(() => DICTIONARIES[this.lang()]);

  constructor() {
    document.documentElement.lang = this.lang();
  }

  setLang(lang: Lang): void {
    this.lang.set(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }

  /**
   * Translates a key, interpolating `{placeholders}`.
   *
   * Declared as an arrow property so templates can call `i18n.t('key')`
   * directly: the `lang()` read happens while the view renders, which makes
   * the view re-render on a language change without any extra plumbing.
   *
   * Pass `count` to select a plural form — Russian needs one/few/many/other,
   * which `Intl.PluralRules` resolves per language.
   */
  t = (key: TranslationKey, params?: TranslateParams): string => {
    const dictionary = this.dictionary();
    let resolved = key;

    if (params && typeof params['count'] === 'number') {
      const category = new Intl.PluralRules(this.locale()).select(
        params['count'],
      );
      const pluralKey = `${key}_${category}` as TranslationKey;
      if (pluralKey in dictionary) resolved = pluralKey;
    }

    const template = dictionary[resolved] ?? en[resolved] ?? resolved;
    return params ? interpolate(template, params) : template;
  };
}

function interpolate(template: string, params: TranslateParams): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/**
 * First visit is Russian by design; the browser language is deliberately not
 * consulted, since most staff browsers report en-US. After that the user's own
 * choice wins and is remembered.
 */
function initialLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
  return stored && stored in DICTIONARIES ? stored : DEFAULT_LANG;
}
