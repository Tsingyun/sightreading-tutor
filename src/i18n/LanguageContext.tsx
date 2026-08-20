/**
 * LanguageContext — Nocturne i18n 运行时
 * ============================================
 * 提供 `t(key)` 翻译函数与语言切换能力。
 * - 默认语言为中文（zh），以契合「汉化」诉求。
 * - 语言选择持久化到 localStorage（key: nocturne-lang）。
 * - 翻译缺失时回退英文，再缺失回退 key 本身，避免界面出现空白。
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { translations, type Lang } from './translations';

const STORAGE_KEY = 'nocturne-lang';

type Params = Record<string, string | number>;

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: string, params?: Params) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/** 按点分路径从嵌套字典中取值 */
function getNested(obj: unknown, path: string): string | undefined {
  const value = path
    .split('.')
    .reduce<unknown>((acc, part) => {
      if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
  return typeof value === 'string' ? value : undefined;
}

/** 将 {name} 占位符替换为参数值 */
function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    params[name] !== undefined ? String(params[name]) : match,
  );
}

function resolve(lang: Lang, key: string): string {
  const fromLang = getNested(translations[lang], key);
  if (fromLang !== undefined) return fromLang;
  const fromEn = getNested(translations.en, key);
  if (fromEn !== undefined) return fromEn;
  return key;
}

function readInitialLang(): Lang {
  if (typeof window === 'undefined') return 'zh';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'en' || stored === 'zh' ? stored : 'zh';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  }, [lang]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);

  const toggleLang = useCallback(
    () => setLangState((prev) => (prev === 'zh' ? 'en' : 'zh')),
    [],
  );

  const t = useCallback(
    (key: string, params?: Params) => interpolate(resolve(lang, key), params),
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
