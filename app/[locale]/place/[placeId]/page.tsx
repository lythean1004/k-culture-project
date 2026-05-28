interface PlacePageProps {
  params: {
    placeId: string;
    locale: string;
  };
}

export default function PlaceDetailPage({ params }: PlacePageProps) {
  return (
    <div className="min-h-screen p-8 bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-indigo-400">
          Place Information: {params.placeId}
        </h1>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <p className="text-slate-300">
            This place is one of the top cultural attractions curated based on public datasets.
          </p>
          <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
            <span className="text-sm text-slate-400">Address: 123 Cultural Road, South Korea</span>
            <a 
              href="https://www.museum.go.kr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
            >
              Official Website &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
