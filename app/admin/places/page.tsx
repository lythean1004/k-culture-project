'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PlaceAdminItem {
  placeId: string;
  nameKo: string;
  cityName: string;
  primaryType: string;
  qualityGrade: string;
  translationSource: string;
  names: Record<string, string>;
  descriptions: Record<string, string>;
}

const mockPlaces: PlaceAdminItem[] = [
  {
    placeId: 'place-1',
    nameKo: '경복궁',
    cityName: 'SEOUL',
    primaryType: 'ATTRACTION',
    qualityGrade: 'A',
    translationSource: 'OFFICIAL_HUMAN',
    names: {
      en: 'Gyeongbokgung Palace',
      ja: '景福宮',
      'zh-Hans': '景福宫',
      'zh-Hant': '景福宮',
    },
    descriptions: {
      en: 'Main royal palace of the Joseon dynasty built in 1395.',
      ja: '1395年に創建された李氏朝鮮の正宮です。',
      'zh-Hans': '建于1395年的朝鲜王朝主要皇宫。',
      'zh-Hant': '建於1395年的朝鮮王朝主要皇宮。',
    }
  },
  {
    placeId: 'place-2',
    nameKo: '국립중앙박물관',
    cityName: 'SEOUL',
    primaryType: 'MUSEUM',
    qualityGrade: 'B',
    translationSource: 'MT_GLOSSARY_AI_POSTEDIT',
    names: {
      en: 'National Museum of Korea',
      ja: '国立中央博物館',
      'zh-Hans': '国立中央博物馆',
      'zh-Hant': '國立中央博物館',
    },
    descriptions: {
      en: 'The flagship museum of Korean history and art.',
      ja: '韓国の歴史と美術を展示する代表的な博物館です。',
      'zh-Hans': '展示韩国历史与美术的代表性博物馆。',
      'zh-Hant': '展示韓國歷史與美術的代表性博物館。',
    }
  },
  {
    placeId: 'place-3',
    nameKo: '광한루원',
    cityName: 'NAMWON',
    primaryType: 'ATTRACTION',
    qualityGrade: 'C',
    translationSource: 'MT_GLOSSARY',
    names: {
      en: 'Gwanghallu-won Garden',
      ja: '広寒楼苑',
      'zh-Hans': '广寒楼苑',
      'zh-Hant': '廣寒樓苑',
    },
    descriptions: {
      en: 'A scenic traditional Korean garden famous for the Chunchyang legend.',
      ja: '春香伝の舞台として知られる美しい韓国の伝統庭園です。',
      'zh-Hans': '以春香传舞台而闻名的美丽韩国传统庭园。',
      'zh-Hant': '以春香傳舞台而聞名的美麗韓國傳統庭園。',
    }
  }
];

export default function AdminPlaces() {
  const [places, setPlaces] = useState<PlaceAdminItem[]>(mockPlaces);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [selectedPlace, setSelectedPlace] = useState<PlaceAdminItem | null>(null);

  // Modal Editing state
  const [editNames, setEditNames] = useState<Record<string, string>>({});
  const [editDescs, setEditDescs] = useState<Record<string, string>>({});
  const [editGrade, setEditGrade] = useState('C');
  const [editSource, setEditSource] = useState('MT_GLOSSARY');
  const [activeTab, setActiveTab] = useState<'en' | 'ja' | 'zh-Hans' | 'zh-Hant'>('en');

  // Filtered places
  const filteredPlaces = places.filter((p) => {
    const matchesSearch = p.nameKo.includes(search) || p.names.en.toLowerCase().includes(search.toLowerCase());
    const matchesCity = cityFilter === 'ALL' || p.cityName === cityFilter;
    const matchesGrade = gradeFilter === 'ALL' || p.qualityGrade === gradeFilter;
    return matchesSearch && matchesCity && matchesGrade;
  });

  const handleRowClick = (place: PlaceAdminItem) => {
    setSelectedPlace(place);
    setEditNames({ ...place.names });
    setEditDescs({ ...place.descriptions });
    setEditGrade(place.qualityGrade);
    setEditSource(place.translationSource);
  };

  const handleSaveChanges = () => {
    if (!selectedPlace) return;
    
    // Update local state list
    setPlaces(
      places.map((p) =>
        p.placeId === selectedPlace.placeId
          ? {
              ...p,
              names: editNames,
              descriptions: editDescs,
              qualityGrade: editGrade,
              translationSource: editSource,
            }
          : p
      )
    );

    setSelectedPlace(null);
    alert('번역 정보가 임시 저장되었습니다. (DB 미연결 상태일 경우 클라이언트 메모리에만 유지)');
  };

  const applyGlossaryRule = () => {
    // Apply glossary term replacement mock
    if (activeTab === 'en') {
      setEditNames({ ...editNames, en: editNames.en.replace(/Palace/g, 'Royal Palace') });
      alert('영어 표준 표기사전(Palace -> Royal Palace) 규칙이 적용되었습니다.');
    } else if (activeTab === 'ja') {
      setEditNames({ ...editNames, ja: editNames.ja.replace(/宮/g, '王宮') });
      alert('일본어 표준 표기사전(宮 -> 王宮) 규칙이 적용되었습니다.');
    } else {
      alert('해당 언어에 적용할 Glossary 규칙이 존재하지 않습니다.');
    }
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
          <Link href="/admin/places" className="text-purple-400 hover:text-purple-300">장소 관리</Link>
          <Link href="/admin/events" className="text-slate-400 hover:text-slate-200">이벤트 관리</Link>
          <Link href="/admin/curations" className="text-slate-400 hover:text-slate-200">에디토리얼</Link>
          <Link href="/admin/glossary" className="text-slate-400 hover:text-slate-200">표기사전</Link>
          <Link href="/admin/sync" className="text-slate-400 hover:text-slate-200">배치/동기화</Link>
          <Link href="/admin/ai-audit" className="text-slate-400 hover:text-slate-200">AI 감사로그</Link>
          <Link href="/admin/feature-flags" className="text-slate-400 hover:text-slate-200">기능 플래그</Link>
        </nav>
      </header>

      {/* Body Content */}
      <main className="flex-grow p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">장소 데이터 및 다국어 번역 관리</h1>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-semibold">한글명/영문명 검색</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="예: 경복궁"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-semibold">도시 필터</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">전체 도시</option>
              <option value="SEOUL">서울</option>
              <option value="BUSAN">부산</option>
              <option value="GYEONGJU">경주</option>
              <option value="JEONJU">전주</option>
              <option value="NAMWON">남원</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-semibold">번역 등급 (SLA)</label>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">전체 등급</option>
              <option value="A">A 등급 (공식 검수)</option>
              <option value="B">B 등급 (AI 포스트에디팅)</option>
              <option value="C">C 등급 (단순 기계번역)</option>
            </select>
          </div>
        </div>

        {/* Place Table */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/20">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="p-3">한글 장소명</th>
                <th className="p-3">도시</th>
                <th className="p-3">분류</th>
                <th className="p-3">번역 완료 명칭 (영어)</th>
                <th className="p-3">품질 등급</th>
                <th className="p-3">번역 출처</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredPlaces.map((p) => (
                <tr
                  key={p.placeId}
                  onClick={() => handleRowClick(p)}
                  className="hover:bg-slate-800/40 cursor-pointer transition"
                >
                  <td className="p-3 font-semibold text-slate-100">{p.nameKo}</td>
                  <td className="p-3 text-slate-400">{p.cityName}</td>
                  <td className="p-3 text-slate-400">{p.primaryType}</td>
                  <td className="p-3 text-slate-200">{p.names.en}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.qualityGrade === 'A' ? 'bg-emerald-500/10 text-emerald-400' : p.qualityGrade === 'B' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      Grade {p.qualityGrade}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 text-[10px]">{p.translationSource}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Editing Modal */}
      {selectedPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelectedPlace(null)}></div>
          
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">
                "{selectedPlace.nameKo}" 다국어 텍스트 상세 편집
              </h3>
              <button onClick={() => setSelectedPlace(null)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            {/* Language Tabs */}
            <div className="flex gap-2 border-b border-slate-800 pb-2">
              {(['en', 'ja', 'zh-Hans', 'zh-Hant'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === tab
                      ? 'bg-purple-600/20 border border-purple-500 text-purple-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab === 'en' ? '영어' : tab === 'ja' ? '일본어' : tab === 'zh-Hans' ? '중국어 간체' : '중국어 번체'}
                </button>
              ))}
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] text-slate-400 font-semibold">번역 장소명</label>
                  <button
                    type="button"
                    onClick={applyGlossaryRule}
                    className="text-[10px] text-purple-400 hover:text-purple-300 underline font-semibold"
                  >
                    표기사전(Glossary) 자동 보정 적용
                  </button>
                </div>
                <input
                  type="text"
                  value={editNames[activeTab] || ''}
                  onChange={(e) => setEditNames({ ...editNames, [activeTab]: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-semibold">다국어 상세 설명</label>
                <textarea
                  value={editDescs[activeTab] || ''}
                  onChange={(e) => setEditDescs({ ...editDescs, [activeTab]: e.target.value })}
                  className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-semibold">번역 등급 (SLA)</label>
                  <select
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="A">A 등급 (공식 검수 완료)</option>
                    <option value="B">B 등급 (AI 포스트 에디팅 완료)</option>
                    <option value="B_MINUS">B- 등급 (검토 대상)</option>
                    <option value="C">C 등급 (기계 번역 초안)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-semibold">번역 출처</label>
                  <select
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="OFFICIAL_HUMAN">OFFICIAL_HUMAN (공식 사이트 인용)</option>
                    <option value="MT_GLOSSARY_AI_POSTEDIT">MT_GLOSSARY_AI_POSTEDIT (AI 검수 번역)</option>
                    <option value="MT_GLOSSARY">MT_GLOSSARY (사전 매칭 번역)</option>
                    <option value="LLM_GENERATED">LLM_GENERATED (AI 생짜 생성)</option>
                    <option value="MANUAL_EDITOR">MANUAL_EDITOR (수동 에디터 편집)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedPlace(null)}
                className="px-4 py-2 border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold transition"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
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
