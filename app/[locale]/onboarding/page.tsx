import { useTranslations } from 'next-intl';

export default function OnboardingPage() {
  const t = useTranslations('Onboarding');
  return (
    <div className="min-h-screen p-8 bg-slate-950 text-slate-100 flex flex-col justify-center items-center">
      <div className="max-w-2xl w-full space-y-8 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl">
        <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
          {t('title')}
        </h1>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">{t('selectCity')}</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {['Seoul', 'Busan', 'Gyeongju', 'Jeonju', 'Namwon'].map((city) => (
                <button key={city} className="p-3 bg-slate-800 hover:bg-purple-600 rounded-lg text-sm font-medium border border-slate-700 hover:border-purple-500 transition">
                  {city}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">{t('selectType')}</label>
            <div className="grid grid-cols-3 gap-3">
              {['Solo', 'Family', 'Friends'].map((type) => (
                <button key={type} className="p-3 bg-slate-800 hover:bg-purple-600 rounded-lg text-sm font-medium border border-slate-700 hover:border-purple-500 transition">
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">{t('selectInterest')}</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['K-Pop', 'History', 'Food', 'Nature', 'Art', 'Shopping'].map((interest) => (
                <button key={interest} className="p-3 bg-slate-800 hover:bg-purple-600 rounded-lg text-sm font-medium border border-slate-700 hover:border-purple-500 transition">
                  {interest}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="pt-6 text-center">
          <button className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition">
            {t('next')}
          </button>
        </div>
      </div>
    </div>
  );
}
