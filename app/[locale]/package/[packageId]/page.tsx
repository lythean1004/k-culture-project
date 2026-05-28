interface PackagePageProps {
  params: {
    packageId: string;
    locale: string;
  };
}

export default function PackageDetailPage({ params }: PackagePageProps) {
  return (
    <div className="min-h-screen p-8 bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
            Package Details: {params.packageId}
          </h1>
          <p className="text-slate-400">A themed itinerary map and timeline.</p>
          <div className="relative border-l-2 border-slate-800 pl-6 ml-3 space-y-8">
            <div className="relative">
              <div className="absolute -left-[31px] bg-slate-950 border-2 border-indigo-500 rounded-full h-4 w-4" />
              <h3 className="text-lg font-bold">1. National Museum of Korea</h3>
              <p className="text-sm text-slate-400">Historical assets and artifacts.</p>
            </div>
            <div className="relative">
              <div className="absolute -left-[31px] bg-slate-950 border-2 border-indigo-500 rounded-full h-4 w-4" />
              <h3 className="text-lg font-bold">2. Gyeongbokgung Palace</h3>
              <p className="text-sm text-slate-400">Traditional architecture and royal guard changing ceremony.</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-2xl border border-slate-800 h-[500px] flex items-center justify-center">
          <span className="text-slate-500">Google Map Area (Interactive)</span>
        </div>
      </div>
    </div>
  );
}
