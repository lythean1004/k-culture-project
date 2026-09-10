import { Suspense } from 'react';
import TripPlanner from '@/components/planner/TripPlanner';
export default function PackagePage({ params }: { params: { locale: string; packageId: string } }) {
  return <Suspense fallback={<div className="planner-loading">Loading your journey...</div>}><TripPlanner locale={params.locale} packageId={params.packageId} /></Suspense>;
}
