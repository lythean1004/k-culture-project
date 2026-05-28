import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function HomePage() {
  const t = useTranslations('Landing');
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between text-sm flex flex-col gap-8">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
          {t('welcome')}
        </h1>
        <p className="text-lg text-slate-300 text-center max-w-md">
          Discover Korea's rich heritage, museums, and events with our custom curated packages.
        </p>
        <Link 
          href="/onboarding"
          className="mt-4 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full font-bold shadow-lg hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300 ease-out text-lg"
        >
          {t('start')}
        </Link>
      </div>
    </main>
  );
}
