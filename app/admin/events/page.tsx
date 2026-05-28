'use client';

import { useState } from 'react';
import Link from 'next/link';

interface EventAdminItem {
  eventId: string;
  titleKo: string;
  genre: string;
  cityName: string;
  status: string;
  foreignerFriendly: boolean;
  sessions: Array<{
    startAt: string;
    endAt?: string;
    runtimeMin?: number;
  }>;
}

const mockEvents: EventAdminItem[] = [
  {
    eventId: 'event-1',
    titleKo: '전통 국악 상설 공연 - 춘향가',
    genre: 'TRADITIONAL_MUSIC',
    cityName: 'NAMWON',
    status: 'ACTIVE',
    foreignerFriendly: true,
    sessions: [
      { startAt: '2026-06-01T14:00:00+09:00', runtimeMin: 90 },
      { startAt: '2026-06-03T14:00:00+09:00', runtimeMin: 90 },
    ]
  },
  {
    eventId: 'event-2',
    titleKo: '부산 현대 미술 특별 전시회',
    genre: 'MODERN_ART',
    cityName: 'BUSAN',
    status: 'ACTIVE',
    foreignerFriendly: false,
    sessions: [
      { startAt: '2026-05-20T10:00:00+09:00', endAt: '2026-06-30T18:00:00+09:00' }
    ]
  },
  {
    eventId: 'event-3',
    titleKo: '경주 월드 카니발 2026',
    genre: 'FESTIVAL',
    cityName: 'GYEONGJU',
    status: 'ACTIVE',
    foreignerFriendly: true,
    sessions: [
      { startAt: '2026-07-15T18:00:00+09:00', runtimeMin: 180 }
    ]
  }
];

export default function AdminEvents() {
  const [events, setEvents] = useState<EventAdminItem[]>(mockEvents);
  const [activeTab, setActiveTab] = useState<'ALL' | 'FRIENDLY' | 'NON_FRIENDLY'>('ALL');

  const handleToggleFriendly = (id: string) => {
    setEvents(
      events.map((e) =>
        e.eventId === id ? { ...e, foreignerFriendly: !e.foreignerFriendly } : e
      )
    );
  };

  const filteredEvents = events.filter((e) => {
    if (activeTab === 'FRIENDLY') return e.foreignerFriendly;
    if (activeTab === 'NON_FRIENDLY') return !e.foreignerFriendly;
    return true;
  });

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
          <Link href="/admin/events" className="text-purple-400 hover:text-purple-300">이벤트 관리</Link>
          <Link href="/admin/curations" className="text-slate-400 hover:text-slate-200">에디토리얼</Link>
          <Link href="/admin/glossary" className="text-slate-400 hover:text-slate-200">표기사전</Link>
          <Link href="/admin/sync" className="text-slate-400 hover:text-slate-200">배치/동기화</Link>
          <Link href="/admin/ai-audit" className="text-slate-400 hover:text-slate-200">AI 감사로그</Link>
          <Link href="/admin/feature-flags" className="text-slate-400 hover:text-slate-200">기능 플래그</Link>
        </nav>
      </header>

      {/* Main Body */}
      <main className="flex-grow p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">이벤트 관리 (공연 / 전시 / 축제)</h1>
        </div>

        {/* Tab switch filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
              activeTab === 'ALL'
                ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            전체 이벤트 ({events.length})
          </button>
          <button
            onClick={() => setActiveTab('FRIENDLY')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
              activeTab === 'FRIENDLY'
                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            외국인 친화 ({events.filter(e => e.foreignerFriendly).length})
          </button>
          <button
            onClick={() => setActiveTab('NON_FRIENDLY')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
              activeTab === 'NON_FRIENDLY'
                ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            일반 이벤트 ({events.filter(e => !e.foreignerFriendly).length})
          </button>
        </div>

        {/* Event List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvents.map((evt) => (
            <div
              key={evt.eventId}
              className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-purple-500/20 bg-purple-500/10 text-purple-400 uppercase tracking-wider">
                    {evt.genre}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">{evt.cityName}</span>
                </div>
                <h3 className="text-base font-bold text-slate-100">{evt.titleKo}</h3>
                
                {/* Session schedules details */}
                <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3.5 space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-400">📅 상설 세션 일정</h4>
                  <div className="space-y-1.5 text-[11px] text-slate-300 font-mono">
                    {evt.sessions.map((sess, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>시작: {new Date(sess.startAt).toLocaleString('ko-KR')}</span>
                        {sess.runtimeMin ? (
                          <span>({sess.runtimeMin}분)</span>
                        ) : (
                          <span>종료: {sess.endAt ? new Date(sess.endAt).toLocaleDateString('ko-KR') : '-'}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Toggle switch controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-850">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">외국인 친화적인 콘텐츠 여부:</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    evt.foreignerFriendly ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {evt.foreignerFriendly ? 'Friendly' : 'General'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleFriendly(evt.eventId)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    evt.foreignerFriendly
                      ? 'bg-amber-600/20 border border-amber-500 text-amber-300 hover:bg-amber-600/30'
                      : 'bg-emerald-600/20 border border-emerald-500 text-emerald-300 hover:bg-emerald-600/30'
                  }`}
                >
                  {evt.foreignerFriendly ? '일반으로 강등' : '친화로 지정'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
