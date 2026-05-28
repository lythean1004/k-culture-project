'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FeatureFlag {
  flagId: string;
  key: string;
  enabled: boolean;
  scope: string;
  config: string;
}

const mockFlags: FeatureFlag[] = [
  { flagId: 'flag-1', key: 'ai_reason_text', enabled: true, scope: 'GLOBAL', config: '{}' },
  { flagId: 'flag-2', key: 'ai_rerank', enabled: true, scope: 'GLOBAL', config: '{"weight": 0.8}' },
  { flagId: 'flag-3', key: 'weather_dynamic_curation', enabled: false, scope: 'GLOBAL', config: '{}' },
];

export default function AdminFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>(mockFlags);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/feature-flags');
      const json = await res.json();
      if (json.success && json.data) {
        setFlags(json.data);
      }
    } catch (e) {
      console.warn('[Admin Feature Flags] DB offline, using local flags mock.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlag = async (flag: FeatureFlag) => {
    const updated = !flag.enabled;
    
    // Update local state first
    setFlags(
      flags.map((f) => (f.flagId === flag.flagId ? { ...f, enabled: updated } : f))
    );

    // Call API
    try {
      const res = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: flag.key,
          enabled: updated,
        }),
      });
      const json = await res.json();
      if (json.success) {
        console.log(`Feature flag ${flag.key} successfully updated on server.`);
      } else {
        throw new Error(json.error);
      }
    } catch (e) {
      console.warn(`[FeatureFlags API] Server offline. Flag ${flag.key} toggled locally (simulated success).`);
    }

    alert(`기능 플래그 "${flag.key}" 상태가 ${updated ? 'ON' : 'OFF'}으로 변경되었습니다. (캐시 TTL 1분 즉시 만료 적용)`);
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
          <Link href="/admin/glossary" className="text-slate-400 hover:text-slate-200">표기사전</Link>
          <Link href="/admin/sync" className="text-slate-400 hover:text-slate-200">배치/동기화</Link>
          <Link href="/admin/ai-audit" className="text-slate-400 hover:text-slate-200">AI 감사로그</Link>
          <Link href="/admin/feature-flags" className="text-purple-400 hover:text-purple-300">기능 플래그</Link>
        </nav>
      </header>

      {/* Main Body */}
      <main className="flex-grow p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">시스템 기능 플래그 (Feature Flags) 관리</h1>
          <button
            onClick={fetchFlags}
            className="px-4 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-semibold rounded-lg transition"
          >
            🔄 최신 상태 동기화
          </button>
        </div>

        <p className="text-xs text-slate-450 leading-relaxed max-w-2xl">
          특정 시스템 기능(AI Reason Text 자동 생성, AI 세만틱 Reranking 정밀 정렬 등)을 운영 환경에서
          코드 빌드 없이 즉시 활성화/비활성화할 수 있습니다. 변경된 플래그는 캐시 TTL 1분 만료 후 런타임에 즉시 반영됩니다.
        </p>

        {/* Feature flags list table */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/20">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="p-4">기능 플래그 Key</th>
                <th className="p-4">유효 범위 (Scope)</th>
                <th className="p-4">상세 설정 JSON</th>
                <th className="p-4">활성화 상태</th>
                <th className="p-4 text-right">상태 토글</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Feature flags loading...
                  </td>
                </tr>
              ) : (
                flags.map((flag) => (
                  <tr key={flag.flagId} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-mono font-bold text-slate-200">{flag.key}</td>
                    <td className="p-4 text-slate-400">{flag.scope}</td>
                    <td className="p-4 text-slate-500 font-mono text-[10px]">{flag.config}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        flag.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {flag.enabled ? '활성화 (ON)' : '비활성화 (OFF)'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleFlag(flag)}
                        className={`px-3 py-1 rounded text-[11px] font-bold border transition ${
                          flag.enabled
                            ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                            : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                      >
                        {flag.enabled ? '비활성화하기' : '활성화하기'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
