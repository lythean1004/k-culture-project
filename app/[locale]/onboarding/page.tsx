import { Suspense } from 'react';
import TripPlanner from '@/components/planner/TripPlanner';
export default function OnboardingPage({ params }: { params: { locale: string } }) {
  return <Suspense fallback={<div className="planner-loading">Loading your journey...</div>}><TripPlanner locale={params.locale} /></Suspense>;
}
