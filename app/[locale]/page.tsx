import { useTranslations } from 'next-intl';
import Link from 'next/link';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import LicenseFooter from '@/components/LicenseFooter';

const cities = [
  {
    code: 'seoul',
    nameKey: 'seoul',
    img: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=600&q=80',
    badge: 'high',
    names: { en: 'Seoul', ja: 'ソウル', 'zh-Hans': '首尔', 'zh-Hant': '首爾' }
  },
  {
    code: 'busan',
    nameKey: 'busan',
    img: 'https://images.unsplash.com/photo-1578840602674-bd891cb7ea5b?auto=format&fit=crop&w=600&q=80',
    badge: 'high',
    names: { en: 'Busan', ja: '釜山', 'zh-Hans': '釜山', 'zh-Hant': '釜山' }
  },
  {
    code: 'gyeongju',
    nameKey: 'gyeongju',
    img: 'https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?auto=format&fit=crop&w=600&q=80',
    badge: 'medium',
    names: { en: 'Gyeongju', ja: '慶州', 'zh-Hans': '庆州', 'zh-Hant': '慶州' }
  },
  {
    code: 'jeonju',
    nameKey: 'jeonju',
    img: 'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=600&q=80',
    badge: 'medium',
    names: { en: 'Jeonju', ja: '全州', 'zh-Hans': '全州', 'zh-Hant': '全州' }
  },
  {
    code: 'namwon',
    nameKey: 'namwon',
    img: 'https://images.unsplash.com/photo-1599839617618-971c26b8b0e8?auto=format&fit=crop&w=600&q=80',
    badge: 'low',
    names: { en: 'Namwon', ja: '南原', 'zh-Hans': '南原', 'zh-Hant': '南原' }
  }
];

interface HomePageProps {
  params: { locale: string };
}

export default function HomePage({ params: { locale } }: HomePageProps) {
  const t = useTranslations('landing');
  const tCommon = useTranslations('common');
  const langKey = (locale as 'en' | 'ja' | 'zh-Hans' | 'zh-Hant') || 'en';

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-50">
      {/* Header bar */}
      <header className="w-full max-w-7xl mx-auto px-4 py-6 flex items-center justify-between z-50">
        <Link href={`/${locale}`} className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
          ✨ K-Culture Curation
        </Link>
        <LanguageSwitcher />
      </header>

      {/* Main content */}
      <main className="flex-grow flex flex-col items-center px-4 max-w-7xl mx-auto w-full">
        {/* Hero Section */}
        <section className="text-center my-12 space-y-6 max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-purple-300 to-pink-200 leading-tight">
            {t('headline')}
          </h1>
          <p className="text-lg md:text-xl text-slate-400 font-medium">
            {t('sub')}
          </p>
        </section>

        {/* Cities Grid */}
        <section className="w-full my-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {cities.map((city) => {
              const name = city.names[langKey] || city.names.en;
              const badgeLabel = city.badge === 'high' 
                ? t('badgeHigh') 
                : city.badge === 'medium' 
                ? t('badgeMedium') 
                : t('badgeLow');
              
              const badgeColor = city.badge === 'high' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : city.badge === 'medium' 
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20';

              return (
                <div
                  key={city.code}
                  className="group relative rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md overflow-hidden hover:border-purple-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 flex flex-col h-72"
                >
                  {/* City Background Image */}
                  <div className="absolute inset-0 z-0">
                    <img
                      src={city.img}
                      alt={name}
                      className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                  </div>

                  {/* Card Content */}
                  <div className="relative z-10 flex flex-col justify-end p-5 h-full space-y-3">
                    <span className={`inline-block self-start px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${badgeColor}`}>
                      {badgeLabel}
                    </span>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-100">{name}</h3>
                      <p className="text-[10px] text-slate-400 tracking-widest uppercase mt-0.5">{city.code}</p>
                    </div>
                    <Link
                      href={`/${locale}/onboarding?city=${city.code}`}
                      className="w-full text-center py-2 px-4 rounded-xl border border-slate-700 bg-slate-950/80 hover:bg-purple-600 hover:border-purple-500 text-slate-200 hover:text-white text-xs font-semibold tracking-wider transition-all duration-300"
                    >
                      {tCommon('explore')}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA to Onboarding */}
        <section className="text-center my-12">
          <Link
            href={`/${locale}/onboarding`}
            className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-full font-bold shadow-lg hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300 ease-out text-lg"
          >
            {t('startInterest')}
          </Link>
        </section>
      </main>

      <LicenseFooter />
    </div>
  );
}
