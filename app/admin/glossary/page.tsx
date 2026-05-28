'use client';

import { useState } from 'react';
import Link from 'next/link';

interface GlossaryTerm {
  termId: string;
  ko: string;
  en: string;
  ja: string;
  zhHans: string;
  zhHant: string;
  category: string;
  approvedFlag: boolean;
}

const mockGlossary: GlossaryTerm[] = [
  {
    termId: 'term-1',
    ko: '경복궁 근정전',
    en: 'Geunjeongjeon Hall of Gyeongbokgung Palace',
    ja: '景福宮 勤政殿',
    zhHans: '景福宫 勤政殿',
    zhHant: '景福宮 勤政殿',
    category: '문화재',
    approvedFlag: true,
  },
  {
    termId: 'term-2',
    ko: '덕수궁 석조전',
    en: 'Seokjojeon Hall of Deoksugung Palace',
    ja: '徳寿宮 石造殿',
    zhHans: '德寿宫 石造殿',
    zhHant: '德壽宮 石造殿',
    category: '문화재',
    approvedFlag: false,
  },
  {
    termId: 'term-3',
    ko: '광한루',
    en: 'Gwanghallu Pavilion',
    ja: '広寒楼',
    zhHans: '广寒楼',
    zhHant: '廣寒樓',
    category: '관광지',
    approvedFlag: true,
  }
];

export default function AdminGlossary() {
  const [glossary, setGlossary] = useState<GlossaryTerm[]>(mockGlossary);
  const [search, setSearch] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);

  // Edit fields state
  const [editKo, setEditKo] = useState('');
  const [editEn, setEditEn] = useState('');
  const [editJa, setEditJa] = useState('');
  const [editZhHans, setEditZhHans] = useState('');
  const [editZhHant, setEditZhHant] = useState('');
  const [editCategory, setEditCategory] = useState('관광지');

  // Filtered list
  const filteredGlossary = glossary.filter((g) =>
    g.ko.includes(search) || g.en.toLowerCase().includes(search.toLowerCase())
  );

  const handleRowClick = (term: GlossaryTerm) => {
    setSelectedTerm(term);
    setEditKo(term.ko);
    setEditEn(term.en);
    setEditJa(term.ja);
    setEditZhHans(term.zhHans);
    setEditZhHant(term.zhHant);
    setEditCategory(term.category);
  };

  const handleToggleApproved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal opening
    setGlossary(
      glossary.map((g) =>
        g.termId === id ? { ...g, approvedFlag: !g.approvedFlag } : g
      )
    );
  };

  const handleSaveTerm = () => {
    if (!selectedTerm) return;
    setGlossary(
      glossary.map((g) =>
        g.termId === selectedTerm.termId
          ? {
              ...g,
              ko: editKo,
              en: editEn,
              ja: editJa,
              zhHans: editZhHans,
              zhHant: editZhHant,
              category: editCategory,
            }
          : g
      )
    );
    setSelectedTerm(null);
    alert('용어 표기 정보가 저장되었습니다.');
  };

  const handleCsvImport = () => {
    // Simulating CSV dictionary upload and bulk loading of unapproved rows
    const importedData: GlossaryTerm[] = [
      {
        termId: `csv-1-${Date.now()}`,
        ko: '창덕궁 돈화문',
        en: 'Donhwamun Gate of Changdeokgung Palace',
        ja: '昌徳宮 敦化門',
        zhHans: '昌德宫 敦化门',
        zhHant: '昌德宮 敦化門',
        category: '문화재',
        approvedFlag: false,
      },
      {
        termId: `csv-2-${Date.now()}`,
        ko: '낙안읍성 민속마을',
        en: 'Nagan Eupseong Folk Village',
        ja: '楽安邑城 民俗村',
        zhHans: '乐安邑城 民俗村',
        zhHant: '樂安邑城 民俗村',
        category: '관광지',
        approvedFlag: false,
      }
    ];

    setGlossary([...importedData, ...glossary]);
    alert('서울 외국어 표기사전 CSV 업로드가 완료되었습니다. 560개의 표준 용어가 [미승인] 상태로 안전하게 가적재되었습니다.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Admin Nav */}
      <header className="bg-slate-900 border-b border-slate-800 py-4 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
            K-Culture 어드민 🇰🇷
          </span>
          <span className="text-xs px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-md font-semibold">
            통합 관리자 모드
          </span>
        </div>
        <nav className="flex gap-4 text-xs font-semibold">
          <Link href="/admin/dashboard" className="text-slate-400 hover:text-slate-200">대시보드</Link>
          <Link href="/admin/places" className="text-slate-400 hover:text-slate-200">장소 관리</Link>
          <Link href="/admin/events" className="text-slate-400 hover:text-slate-200">이벤트 관리</Link>
          <Link href="/admin/curations" className="text-slate-400 hover:text-slate-200">에디토리얼</Link>
          <Link href="/admin/glossary" className="text-purple-400 hover:text-purple-300">표기사전</Link>
          <Link href="/admin/sync" className="text-slate-400 hover:text-slate-200">배치/동기화</Link>
          <Link href="/admin/ai-audit" className="text-slate-400 hover:text-slate-200">AI 감사로그</Link>
          <Link href="/admin/feature-flags" className="text-slate-400 hover:text-slate-200">기능 플래그</Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">다국어 용어 사전 (Glossary) 관리</h1>
          
          {/* CSV upload stub */}
          <button
            onClick={handleCsvImport}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-purple-500/15"
          >
            📥 서울 외국어 표기사전 CSV 임포트
          </button>
        </div>

        {/* Search */}
        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl max-w-sm">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-semibold">용어 검색 (한글/영어)</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="예: 근정전"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Glossary list */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/20">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="p-3">한글 표준 용어</th>
                <th className="p-3">영어 표기</th>
                <th className="p-3">일본어 표기</th>
                <th className="p-3">중국어 간체</th>
                <th className="p-3">분류</th>
                <th className="p-3">승인 상태</th>
                <th className="p-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredGlossary.map((g) => (
                <tr
                  key={g.termId}
                  onClick={() => handleRowClick(g)}
                  className="hover:bg-slate-800/40 cursor-pointer transition"
                >
                  <td className="p-3 font-semibold text-slate-100">{g.ko}</td>
                  <td className="p-3 text-slate-200">{g.en}</td>
                  <td className="p-3 text-slate-400">{g.ja}</td>
                  <td className="p-3 text-slate-400">{g.zhHans}</td>
                  <td className="p-3 text-slate-400">{g.category}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      g.approvedFlag ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {g.approvedFlag ? '승인됨' : '대기중'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => handleToggleApproved(g.termId, e)}
                      className={`px-2 py-1 rounded text-[10px] font-semibold border transition ${
                        g.approvedFlag
                          ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                          : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                    >
                      {g.approvedFlag ? '승인 취소' : '승인 완료'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Editing Modal */}
      {selectedTerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelectedTerm(null)}></div>
          
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">표준 표기 용어 편집</h3>
              <button onClick={() => setSelectedTerm(null)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-semibold">한글 원문</label>
                <input
                  type="text"
                  value={editKo}
                  onChange={(e) => setEditKo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-semibold">영어 표준 표기</label>
                  <input
                    type="text"
                    value={editEn}
                    onChange={(e) => setEditEn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-semibold">일본어 표준 표기</label>
                  <input
                    type="text"
                    value={editJa}
                    onChange={(e) => setEditJa(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-semibold">중국어 간체</label>
                  <input
                    type="text"
                    value={editZhHans}
                    onChange={(e) => setEditZhHans(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-semibold">중국어 번체</label>
                  <input
                    type="text"
                    value={editZhHant}
                    onChange={(e) => setEditZhHant(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-semibold">용어 카테고리</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                >
                  <option value="관광지">관광지</option>
                  <option value="문화시설">문화시설</option>
                  <option value="전시">전시</option>
                  <option value="문화재">문화재</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedTerm(null)}
                className="px-4 py-2 border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold transition"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveTerm}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-lg text-xs font-bold transition"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
