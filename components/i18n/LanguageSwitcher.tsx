'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const localeNames: Record<string, string> = {
  en: 'English',
  ja: '日本語',
  'zh-Hans': '简体中文',
  'zh-Hant': '繁體中文',
};

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Extract current locale from pathname (e.g., "/en/onboarding" -> "en")
  const segments = pathname.split('/');
  const currentLocale = segments[1] || 'en';

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === currentLocale) return;
    const newSegments = [...segments];
    newSegments[1] = newLocale;
    const newPath = newSegments.join('/') || '/';
    setIsOpen(false);
    router.push(newPath);
  };

  return (
    <div className="relative inline-block text-left z-50">
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex justify-center w-full rounded-md border border-slate-700 shadow-sm px-4 py-2 bg-slate-900/80 backdrop-blur-md text-sm font-medium text-slate-200 hover:bg-slate-800 hover:text-white focus:outline-none transition-all"
          id="menu-button"
          aria-expanded="true"
          aria-haspopup="true"
        >
          🌐 {localeNames[currentLocale] || currentLocale}
          <svg
            className="-mr-1 ml-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>
          <div
            className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-slate-900 border border-slate-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="menu-button"
          >
            <div className="py-1" role="none">
              {Object.entries(localeNames).map(([code, name]) => (
                <button
                  key={code}
                  onClick={() => handleLocaleChange(code)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    currentLocale === code
                      ? 'bg-purple-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  role="menuitem"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
