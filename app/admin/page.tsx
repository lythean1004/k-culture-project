export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-bold text-white">K-Culture 관리자 대시보드</h1>
          <span className="text-sm px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20 font-medium">
            운영모드
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-sm font-medium text-slate-400">총 등록 장소</h3>
            <p className="text-3xl font-bold mt-2">124개</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-sm font-medium text-slate-400">진행 공연/행사</h3>
            <p className="text-3xl font-bold mt-2">32개</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-sm font-medium text-slate-400">생성된 패키지</h3>
            <p className="text-3xl font-bold mt-2">15개</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-sm font-medium text-slate-400">API 연동 상태</h3>
            <p className="text-3xl font-bold mt-2 text-emerald-400">정상</p>
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold mb-4 text-white">동기화 관리</h2>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition text-sm">
              관광지 데이터 동기화
            </button>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition text-sm">
              공연/전시 데이터 동기화
            </button>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition text-sm">
              박물관 유물 표준데이터 동기화
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
