'use client';

export default function LicenseFooter() {
  return (
    <footer className="w-full mt-16 border-t border-slate-800 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-left space-y-1">
          <p className="font-semibold text-slate-400">K-Culture Curation Platform MVP</p>
          <p>© 2026 K-Culture Curation Platform. All rights reserved.</p>
          <p className="max-w-md leading-relaxed text-slate-600">
            This service utilizes public data provided by the Ministry of Culture, Sports and Tourism of Korea, TourAPI, Kopis, and National Museum portal. The service attribution complies with the Korea Open Government License (KOGL).
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1 border border-slate-800 px-3 py-1.5 rounded-lg bg-slate-900/40">
            <span className="text-[10px] font-bold tracking-widest text-slate-400">KOGL</span>
            <span className="text-[9px] text-slate-500">공공누리 출처 표시</span>
          </div>
          <div className="flex flex-col gap-1 text-right text-[11px]">
            <a
              href="https://www.data.go.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline hover:text-purple-400 transition-colors"
            >
              Public Data Portal (data.go.kr)
            </a>
            <a
              href="https://api.visitkorea.or.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline hover:text-purple-400 transition-colors"
            >
              TourAPI 4.0
            </a>
            <a
              href="http://www.kopis.or.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline hover:text-purple-400 transition-colors"
            >
              KOPIS API
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
