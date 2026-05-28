import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

interface OnboardingPageProps {
  params: { locale: string };
  searchParams: { city?: string };
}

export default function OnboardingPage({ params: { locale }, searchParams }: OnboardingPageProps) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl w-full">
          <OnboardingWizard locale={locale} initialCity={searchParams.city} />
        </div>
      </div>
    </main>
  );
}
