'use client';

import { useState } from 'react';
import Link from 'next/link';

interface AuditLogItem {
  id: string;
  purpose: string;
  provider: string;
  modelName: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  errorCode: string | null;
  createdAt: string;
  output: string;
}

interface HallucinationReport {
  id: string;
  packageId: string;
  packageName: string;
  feedbackType: string;
  comment: string;
  createdAt: string;
}

const mockAuditLogs: AuditLogItem[] = [
  {
    id: 'audit-1',
    purpose: 'REASON_TEXT',
    provider: 'gemini',
    modelName: 'gemini-2.0-flash-exp',
    tokensIn: 412,
    tokensOut: 85,
    latencyMs: 340,
    errorCode: null,
    createdAt: '2026-05-28T19:22:00Z',
    output: 'A history day trip curated for your interest in ancient temples and historic palaces around Seoul.'
  },
  {
    id: 'audit-2',
    purpose: 'REASON_TEXT',
    provider: 'gemini',
    modelName: 'gemini-2.0-flash-exp',
    tokensIn: 395,
    tokensOut: 62,
    latencyMs: 290,
    errorCode: null,
    createdAt: '2026-05-28T19:20:12Z',
    output: 'A traditional music course featuring gugak instruments and dance performances.'
  },
  {
    id: 'audit-3',
    purpose: 'REASON_TEXT',
    provider: 'gemini',
    modelName: 'gemini-2.0-flash-exp',
    tokensIn: 440,
    tokensOut: 98,
    latencyMs: 1400,
    errorCode: 'AI_RATE_LIMIT_EXCEEDED',
    createdAt: '2026-05-28T19:15:30Z',
    output: ''
  }
];

const mockHallucinationReports: HallucinationReport[] = [
  {
    id: 'report-1',
    packageId: 'pkg-day-history-0',
    packageName: 'HISTORY Curated One-Day Course',
    feedbackType: 'REPORT_HALLUCINATION',
    comment: '영어 설명에서 경복궁 입장료가 15,000원으로 잘못 생성되었습니다 (실제 3,000원).',
    createdAt: '2026-05-28T18:10:00Z'
  }
];

export default function AdminAiAudit() {
  const [auditLogs] = useState<AuditLogItem[]>(mockAuditLogs);
  const [reports] = useState<HallucinationReport[]>(mockHallucinationReports);
  const [purposeFilter, setPurposeFilter] = useState('ALL');

  const filteredLogs = purposeFilter === 'ALL'
    ? auditLogs
    : auditLogs.filter(l => l.purpose === purposeFilter);

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
          <Link href="/admin/ai-audit" className="text-purple-400 hover:text-purple-300">AI 감사로그</Link>
          <Link href="/admin/feature-flags" className="text-slate-400 hover:text-slate-200">기능 플래그</Link>
        </nav>
      </header>

      {/* Main Body */}
      <main className="flex-grow p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">AI 호출 감사 및 프롬프트 거버넌스</h1>
        </div>

        {/* Prompt statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Prompt Version Stat */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-300">📌 시스템 프롬프트 버전 현황</h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span>Reason Text Prompt (v1.2)</span>
                <span className="text-emerald-400 font-bold">Active</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span>Reranking Prompt (v1.0)</span>
                <span className="text-emerald-400 font-bold">Active</span>
              </div>
              <div className="flex justify-between items-center pb-1">
                <span>Chat Assistant (v1.5)</span>
                <span className="text-slate-500">Deactivated (v1.6 대기)</span>
              </div>
            </div>
          </div>

          {/* Prompt Performance */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-300">📊 Prompt Version 통계</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>reason-text v1.2</span>
                <span>총 호출 1,420건 (환각률 0.12%)</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full" style={{ width: '99%' }}></div>
              </div>
              <div className="flex justify-between text-slate-400 pt-1">
                <span>reason-text v1.1 (이전)</span>
                <span>총 호출 840건 (환각률 1.82%)</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-slate-700 h-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>

          {/* Hallucination Queue alert */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-xl space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-300">🚨 환각 신고 및 피드백 큐</h3>
              <p className="text-[11px] text-slate-500 mt-1">사용자 신고 (REPORT_HALLUCINATION)</p>
            </div>
            
            <div className="py-2 flex items-center justify-between">
              <div className="text-left">
                <span className="text-2xl font-bold text-amber-500">{reports.length}</span>
                <span className="text-xs text-slate-400 ml-1">건 미해결</span>
              </div>
              <span className="text-[10px] text-amber-400 font-semibold px-2 py-0.5 bg-amber-500/10 rounded">
                즉시 검토 필요
              </span>
            </div>
          </div>
        </div>

        {/* Hallucination feedback list */}
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-300">환각 신고 대기열</h3>
          <div className="space-y-3">
            {reports.map((rep) => (
              <div key={rep.id} className="border border-slate-850 p-4 rounded-xl bg-slate-950/40 flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded">
                    {rep.feedbackType}
                  </span>
                  <h4 className="text-xs font-bold text-slate-200 mt-2">대상 패키지: {rep.packageName}</h4>
                  <p className="text-xs text-slate-400 leading-normal">{rep.comment}</p>
                </div>
                <div className="text-right text-[10px] text-slate-500 self-end sm:self-center">
                  <span>신고일시: {new Date(rep.createdAt).toLocaleString('ko-KR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit list with filters */}
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300">최근 AI 호출 감사 데이터 (최근 100건)</h3>
            <select
              value={purposeFilter}
              onChange={(e) => setPurposeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="ALL">전체 목적 필터</option>
              <option value="REASON_TEXT">REASON_TEXT</option>
              <option value="CHAT">CHAT</option>
              <option value="RERANK">RERANK</option>
            </select>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="p-3">호출 시간</th>
                  <th className="p-3">목적</th>
                  <th className="p-3">모델</th>
                  <th className="p-3">토큰 (In/Out)</th>
                  <th className="p-3">지연속도</th>
                  <th className="p-3">상태</th>
                  <th className="p-3">생성 텍스트</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-3 text-slate-400">{new Date(log.createdAt).toLocaleTimeString('ko-KR')}</td>
                    <td className="p-3 font-semibold text-slate-200">{log.purpose}</td>
                    <td className="p-3 text-slate-400">{log.modelName}</td>
                    <td className="p-3 text-slate-400">{log.tokensIn} / {log.tokensOut}</td>
                    <td className="p-3 text-slate-400">{log.latencyMs}ms</td>
                    <td className="p-3">
                      {log.errorCode ? (
                        <span className="text-red-400 font-bold">{log.errorCode}</span>
                      ) : (
                        <span className="text-emerald-400 font-bold">SUCCESS</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-300 max-w-[200px] truncate" title={log.output}>
                      {log.output || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
