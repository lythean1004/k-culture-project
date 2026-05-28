'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CurationItem {
  curationId: string;
  cityName: string;
  themeCode: string;
  titleKo: string;
  bodyKo: string;
  translations: Record<string, { title: string; body: string }>;
  publishFrom: string;
  publishTo: string;
}

const mockCurations: CurationItem[] = [
  {
    curationId: 'curation-1',
    cityName: 'NAMWON',
    themeCode: 'HISTORY',
    titleKo: '남원의 숨겨진 조선 시대 정원, 광한루원 깊이 읽기',
    bodyKo: '광한루원은 조선 시대의 대표적인 정원으로, 한국의 고전 소설 춘향전의 무대입니다. 이곳의 역사적 의의와 수려한 정원 조경을 심층 해설합니다.',
    translations: {
      en: { title: 'Deep Dive into Gwanghallu-won Garden in Namwon', body: 'Gwanghallu-won is a quintessential Joseon dynasty garden...' },
      ja: { title: '南原の隠れた名園、広寒楼苑の深層解説', body: '広寒楼苑は、朝鮮時代の代表的な庭園であり...' },
    },
    publishFrom: '2026-05-01',
    publishTo: '2026-12-31',
  }
];

export default function AdminCurations() {
  const [curations, setCurations] = useState<CurationItem[]>(mockCurations);
  const [isCreating, setIsCreating] = useState(false);

  // New curation form states
  const [newCity, setNewCity] = useState('NAMWON');
  const [newTheme, setNewTheme] = useState('HISTORY');
  const [newTitleKo, setNewTitleKo] = useState('');
  const [newBodyKo, setNewBodyKo] = useState('');
  const [newPublishFrom, setNewPublishFrom] = useState('2026-05-28');
  const [newPublishTo, setNewPublishTo] = useState('2026-12-31');

  // Translations draft state
  const [draftTranslations, setDraftTranslations] = useState<Record<string, { title: string; body: string }>>({});
  const [translating, setTranslating] = useState(false);

  const handleGenerateTranslationDraft = async () => {
    if (!newTitleKo || !newBodyKo) {
      alert('한국어 제목과 본문을 입력한 후 초안을 생성해 주세요.');
      return;
    }
    setTranslating(true);
    
    // Simulate multi-language draft generation with 2 seconds latency (mimicking AI Gateway parallel translate calls)
    setTimeout(() => {
      setDraftTranslations({
        en: {
          title: `[Draft] Curated Route: ${newTitleKo}`,
          body: `[Draft Translated Curation Content] ${newBodyKo} (Attribution: K-Culture Platform)`
        },
        ja: {
          title: `[草案] 厳選コース: ${newTitleKo}`,
          body: `[翻訳草案コンテンツ] ${newBodyKo}`
        },
        'zh-Hans': {
          title: `[草案] 精选路线: ${newTitleKo}`,
          body: `[翻译草案内容] ${newBodyKo}`
        },
        'zh-Hant': {
          title: `[草案] 精選路線: ${newTitleKo}`,
          body: `[翻譯草案內容] ${newBodyKo}`
        }
      });
      setTranslating(false);
      alert('4개 국어(영어, 일본어, 중국어 간체, 중국어 번체) 번역 초안이 AI 기반으로 동시 생성되었습니다. 검수 후 저장해 주세요.');
    }, 1500);
  };

  const handleSaveCuration = () => {
    if (!newTitleKo || !newBodyKo) return;

    const newItem: CurationItem = {
      curationId: `curation-${Date.now()}`,
      cityName: newCity,
      themeCode: newTheme,
      titleKo: newTitleKo,
      bodyKo: newBodyKo,
      translations: draftTranslations,
      publishFrom: newPublishFrom,
      publishTo: newPublishTo
    };

    setCurations([newItem, ...curations]);
    setIsCreating(false);
    
    // Reset form
    setNewTitleKo('');
    setNewBodyKo('');
    setDraftTranslations({});
    alert('에디토리얼 수동 큐레이션이 성공적으로 등록되었습니다.');
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
          <Link href="/admin/curations" className="text-purple-400 hover:text-purple-300">에디토리얼</Link>
          <Link href="/admin/glossary" className="text-slate-400 hover:text-slate-200">표기사전</Link>
          <Link href="/admin/sync" className="text-slate-400 hover:text-slate-200">배치/동기화</Link>
          <Link href="/admin/ai-audit" className="text-slate-400 hover:text-slate-200">AI 감사로그</Link>
          <Link href="/admin/feature-flags" className="text-slate-400 hover:text-slate-200">기능 플래그</Link>
        </nav>
      </header>

      {/* Main Body */}
      <main className="flex-grow p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">에디토리얼 큐레이션 관리</h1>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-purple-500/15"
            >
              ➕ 수동 큐레이션 작성 (API 부족 도시 보완)
            </button>
          )}
        </div>

        {/* Curation Form Block */}
        {isCreating && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 animate-fade-in duration-300">
            <h3 className="text-sm font-bold text-slate-350 pb-2 border-b border-slate-800">
              신규 에디토리얼 수동 큐레이션 등록
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-semibold">대상 도시</label>
                <select
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="NAMWON">남원 (API 리소스 부족)</option>
                  <option value="JEONJU">전주</option>
                  <option value="GYEONGJU">경주</option>
                  <option value="BUSAN">부산</option>
                  <option value="SEOUL">서울</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-semibold">패키지 테마</label>
                <select
                  value={newTheme}
                  onChange={(e) => setNewTheme(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="HISTORY">🏛️ 역사와 전통</option>
                  <option value="TRADITIONAL_MUSIC">🪕 국악과 공연</option>
                  <option value="WELLNESS">🌿 힐링과 자연</option>
                  <option value="FOOD">🍜 K-푸드 식도락</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-semibold">한국어 제목</label>
                <input
                  type="text"
                  value={newTitleKo}
                  onChange={(e) => setNewTitleKo(e.target.value)}
                  placeholder="예: 남원의 역사를 걷다"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-semibold">한국어 설명 원문</label>
                <textarea
                  value={newBodyKo}
                  onChange={(e) => setNewBodyKo(e.target.value)}
                  placeholder="패키지를 구성하는 핵심 소개 글을 입력해 주세요."
                  className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Translate trigger button */}
            <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-xl flex items-center justify-between">
              <span className="text-xs text-slate-400">
                한국어 입력을 토대로 4개 언어의 번역 초안을 즉시 자동 생성합니다.
              </span>
              <button
                type="button"
                onClick={handleGenerateTranslationDraft}
                disabled={translating}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition"
              >
                {translating ? '번역 생성 중...' : '✨ AI 번역 초안 생성'}
              </button>
            </div>

            {/* Render Drafted Translations */}
            {Object.keys(draftTranslations).length > 0 && (
              <div className="space-y-3 bg-slate-950/20 p-4 border border-slate-850 rounded-xl">
                <h4 className="text-xs font-bold text-purple-400">Generated Translations Preview (검수 대상)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {Object.entries(draftTranslations).map(([lang, data]) => (
                    <div key={lang} className="border border-slate-850 p-3 rounded-lg bg-slate-900/60 space-y-1">
                      <span className="uppercase text-[9px] font-bold text-slate-400">{lang}</span>
                      <h5 className="font-bold text-slate-200">{data.title}</h5>
                      <p className="text-slate-400 leading-normal text-[11px]">{data.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-semibold">발행 시작일</label>
                <input
                  type="date"
                  value={newPublishFrom}
                  onChange={(e) => setNewPublishFrom(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-semibold">발행 종료일</label>
                <input
                  type="date"
                  value={newPublishTo}
                  onChange={(e) => setNewPublishTo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>
            </div>

            {/* Form footer */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewTitleKo('');
                  setNewBodyKo('');
                  setDraftTranslations({});
                }}
                className="px-4 py-2 border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold transition"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveCuration}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-lg text-xs font-bold transition"
              >
                저장 및 발행
              </button>
            </div>
          </div>
        )}

        {/* Existing Curations list */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-350">현재 발행 중인 수동 큐레이션 리스트</h3>
          <div className="space-y-3">
            {curations.map((cur) => (
              <div
                key={cur.curationId}
                className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl flex flex-col sm:flex-row justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-widest">
                      {cur.cityName}
                    </span>
                    <span className="text-[10px] text-slate-500">테마: {cur.themeCode}</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-100">{cur.titleKo}</h4>
                  <p className="text-xs text-slate-400 leading-normal">{cur.bodyKo}</p>
                </div>

                <div className="flex flex-col justify-between items-end text-right min-w-[150px]">
                  <span className="text-[10px] text-slate-500">
                    발행 기간:<br />
                    {cur.publishFrom} ~ {cur.publishTo}
                  </span>
                  <div className="flex gap-2.5 mt-2">
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded">
                      발행 중
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
