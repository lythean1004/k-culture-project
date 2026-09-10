import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import TripPlanner from '@/components/planner/TripPlanner';
import { isCityCode } from '@/lib/recommend/cities';
export default function CityPage({ params }: { params: { locale: string; cityCode: string } }) {
  if (params.cityCode !== 'multi' && !isCityCode(params.cityCode)) notFound();
  return <Suspense fallback={<div className="planner-loading">Loading your journey...</div>}><TripPlanner locale={params.locale} initialCity={params.cityCode} autoGenerate /></Suspense>;
}
