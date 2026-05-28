interface CityPageProps {
  params: {
    cityId: string;
    locale: string;
  };
}

export default function CityPage({ params }: CityPageProps) {
  return (
    <div className="min-h-screen p-8 bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-4xl font-extrabold capitalize text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">
          Explore {params.cityId}
        </h1>
        <p className="text-slate-400">Curated packages combining K-Culture places and events.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Card placeholders */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <h3 className="text-xl font-bold text-slate-100">Heritage & Art Package</h3>
            <p className="text-sm text-slate-400">Explore historical landmarks and national museums with a local guide.</p>
            <div className="pt-4">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">3 Places</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
