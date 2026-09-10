'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, MapPin, Search, Route, CalendarDays, Train, Car, Footprints, Loader2, Check, Bookmark, Share2, ExternalLink, Compass, X } from 'lucide-react';
import CityMap from '@/components/map/CityMap';
import { CITY_OPTIONS, isCityCode, getCityOption, visitFormFromDayCount } from '@/lib/recommend/cities';
import { PackageItem, RecommendInput, RecommendedPackage, ThemeCode } from '@/lib/recommend/types';

const themes: { code: ThemeCode; label: string }[] = [
  { code: 'HISTORY', label: 'History & heritage' }, { code: 'FOOD', label: 'Local food' },
  { code: 'WELLNESS', label: 'Nature & coast' }, { code: 'MODERN_ART', label: 'Art & culture' },
  { code: 'FAMILY', label: 'Family time' }, { code: 'NIGHT', label: 'After dark' },
  { code: 'TRADITIONAL_MUSIC', label: 'Traditional music' }, { code: 'FESTIVAL', label: 'Festivals' },
];
const copy = {
  en: { explore: 'Explore Korea', saved: 'Saved trips', title: 'Your next Korean journey.', region: 'Where to?', multi: 'Multi-city trip', search: 'Search cities', days: 'How many days?', interests: 'What moves you?', transport: 'Getting around', generate: 'Build my itinerary', route: 'Your itinerary', map: 'Map', all: 'All days', edit: 'Edit trip', empty: 'A place to begin.', emptyText: '18 cities. Your own pace.', selected: 'Selected cities', noResults: 'No cities found.', loading: 'Putting your trip together...', save: 'Save trip', share: 'Copy link' },
  ja: { explore: '韓国を旅する', saved: '保存した旅', title: '次の韓国旅行へ。', region: 'どこへ？', multi: '複数の都市', search: '都市を検索', days: '何日間？', interests: '興味のあること', transport: '移動手段', generate: '旅程を作成', route: '旅程', map: '地図', all: 'すべての日', edit: '旅を編集', empty: '旅の始まり。', emptyText: '18都市。自分のペースで。', selected: '選択した都市', noResults: '都市が見つかりません。', loading: '旅程を作成中...', save: '旅を保存', share: 'リンクをコピー' },
  'zh-Hans': { explore: '探索韩国', saved: '收藏行程', title: '开启下一段韩国之旅。', region: '去哪里？', multi: '多城市旅行', search: '搜索城市', days: '旅行几天？', interests: '你的兴趣', transport: '交通方式', generate: '生成行程', route: '你的行程', map: '地图', all: '全部天数', edit: '修改行程', empty: '旅程的起点。', emptyText: '18座城市，自己的节奏。', selected: '已选城市', noResults: '未找到城市。', loading: '正在规划旅程...', save: '收藏行程', share: '复制链接' },
  'zh-Hant': { explore: '探索韓國', saved: '收藏行程', title: '開啟下一段韓國之旅。', region: '去哪裡？', multi: '多城市旅行', search: '搜尋城市', days: '旅行幾天？', interests: '你的興趣', transport: '交通方式', generate: '產生行程', route: '你的行程', map: '地圖', all: '全部天數', edit: '修改行程', empty: '旅程的起點。', emptyText: '18座城市，自己的節奏。', selected: '已選城市', noResults: '未找到城市。', loading: '正在規劃旅程...', save: '收藏行程', share: '複製連結' },
};
const emptyItems: PackageItem[] = [];

export default function TripPlanner({ locale, initialCity, packageId, autoGenerate = false }: { locale: string; initialCity?: string; packageId?: string; autoGenerate?: boolean }) {
  const lang = (locale in copy ? locale : 'en') as keyof typeof copy;
  const t = copy[lang];
  const searchParams = useSearchParams();
  const rawCities = searchParams.get('cities')?.split(',') || [searchParams.get('city') || initialCity || 'seoul'];
  const validCities = Array.from(new Set(rawCities.filter(isCityCode))).slice(0, 3);
  const [cities, setCities] = useState<string[]>(validCities.length ? validCities : ['seoul']);
  const [multi, setMulti] = useState(cities.length > 1);
  const [days, setDays] = useState<1 | 2 | 3>(Math.max(cities.length, Math.min(3, Math.max(1, Number(searchParams.get('days')) || 1))) as 1 | 2 | 3);
  const [interests, setInterests] = useState<ThemeCode[]>(() => {
    const requested = searchParams.get('themes')?.split(',').filter(code => themes.some(theme => theme.code === code));
    return requested?.length ? requested.slice(0, 3) as ThemeCode[] : ['HISTORY'];
  });
  const [transport, setTransport] = useState<RecommendInput['transportMode']>(() => ['WALK', 'CAR', 'TRANSIT'].includes(searchParams.get('transport') || '') ? searchParams.get('transport') as RecommendInput['transportMode'] : 'TRANSIT');
  const [query, setQuery] = useState('');
  const [packages, setPackages] = useState<RecommendedPackage[]>([]);
  const [selected, setSelected] = useState(0);
  const [day, setDay] = useState(0);
  const [activeItemId, setActiveItemId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dataSource, setDataSource] = useState('');
  const [saved, setSaved] = useState<RecommendedPackage[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const request = useRef<AbortController>();
  const pkg = packages[selected];
  const displayedItems = pkg?.items.filter(item => !day || item.dayNumber === day) || emptyItems;
  const cityNames = cities.map(code => getCityOption(code).name).join(' + ');
  const filteredCities = CITY_OPTIONS.filter(city => `${city.name} ${city.nameKo} ${city.hubLabel}`.toLowerCase().includes(query.toLowerCase()));

  function readSaved() { try { setSaved(JSON.parse(localStorage.getItem('kc-saved-trips') || '[]')); } catch { setSaved([]); } }
  function clearResult() { request.current?.abort(); setLoading(false); setPackages([]); setDay(0); setError(''); setNotice(''); }
  function selectCity(code: string) {
    clearResult();
    if (!multi) { setCities([code]); return; }
    if (cities.includes(code)) { if (cities.length > 1) setCities(cities.filter(city => city !== code)); return; }
    if (cities.length >= 3) { setNotice('Choose up to 3 cities for a 3-day trip.'); return; }
    const next = [...cities, code]; setCities(next); setDays(Math.max(days, next.length) as 1 | 2 | 3);
  }
  function remember(result: RecommendedPackage[]) {
    try { result.forEach(route => localStorage.setItem(`kc-route:${route.packageId}`, JSON.stringify(route))); } catch { /* Browsing still works when storage is unavailable. */ }
  }
  async function generate() {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setLoading(true); setError(''); setNotice(''); setPackages([]); setSelected(0); setDay(0);
    const params = new URLSearchParams({ cities: cities.join(','), days: String(days), themes: interests.join(','), transport });
    window.history.replaceState(null, '', `/${lang}?${params}`);
    try {
      const response = await fetch('/api/recommend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ cityCode: cities[0], cityCodes: cities, tripDays: days, visitForm: visitFormFromDayCount(days), interests, lang, transportMode: transport }) });
      const result = await response.json();
      if (!response.ok) throw new Error('Your itinerary could not be generated. Please try again.');
      if (controller.signal.aborted) return;
      setPackages(result.packages); setDataSource(result.dataSource); remember(result.packages);
      if (!result.packages.length) setNotice('Not enough places for this trip. Try fewer days or a different interest.');
    } catch (err) { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Unable to connect. Please try again.'); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }
  useEffect(() => {
    readSaved();
    if (packageId) {
      setLoading(true);
      const controller = new AbortController(); request.current = controller;
      fetch(`/api/packages/${encodeURIComponent(packageId)}`, { signal: controller.signal }).then(async response => {
        if (!response.ok) throw new Error('This route has expired. Build a new itinerary.');
        return (await response.json()).data as RecommendedPackage;
      }).catch(err => {
        if (controller.signal.aborted) throw err;
        const stored = localStorage.getItem(`kc-route:${packageId}`);
        if (stored) return JSON.parse(stored) as RecommendedPackage;
        throw err;
      }).then(route => {
        if (controller.signal.aborted) return;
        setPackages([route]); setCities(route.cityCodes || ['seoul']); setDays((route.dayCount || 1) as 1 | 2 | 3); setMulti((route.cityCodes?.length || 1) > 1);
        setDataSource(route.items.some(item => item.source === 'mock') ? 'local-catalog' : 'database');
      }).catch(err => { if (!controller.signal.aborted) setError(err.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    } else if (autoGenerate || searchParams.has('days')) { void generate(); }
    return () => request.current?.abort();
  // Initial URL is restored once; subsequent edits are controlled by the form.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageId]);

  function saveTrip() {
    if (!pkg) return;
    const next = saved.some(item => item.packageId === pkg.packageId) ? saved.filter(item => item.packageId !== pkg.packageId) : [...saved, pkg];
    try { localStorage.setItem('kc-saved-trips', JSON.stringify(next)); setSaved(next); } catch { setNotice('Browser storage is unavailable.'); }
  }
  async function shareTrip() {
    if (!pkg) return;
    try { await navigator.clipboard.writeText(`${location.origin}/${lang}/package/${pkg.packageId}`); setNotice('Route link copied.'); }
    catch { setNotice('Link could not be copied. Open the full route to copy its address.'); }
  }

  return <div className="planner-app">
    <header className="planner-header"><Link href={`/${lang}`} className="planner-brand"><span className="brand-mark"><Compass size={22} /></span>K-Culture<span className="brand-dot">.</span></Link>
      <nav aria-label="Main navigation"><Link href={`/${lang}`} className="nav-active">{t.explore}</Link><button onClick={() => { readSaved(); setShowSaved(true); }}><Bookmark size={15} />{t.saved}<span className="saved-count">{saved.length}</span></button></nav>
      <select aria-label="Language" value={lang} onChange={event => { const path = window.location.pathname.split('/'); path[1] = event.target.value; window.location.href = `${path.join('/')}${window.location.search}`; }}><option value="en">English</option><option value="ja">日本語</option><option value="zh-Hans">简体中文</option><option value="zh-Hant">繁體中文</option></select>
    </header>
    <div className="planner-heading"><div><p className="eyebrow">KOREA, ONE DAY AT A TIME</p><h1>{t.title}</h1></div><span className="trip-counter"><MapPin size={16} />18 destinations <span> / </span> 1–3 days</span></div>
    <main className="planner-workspace">
      <aside className="trip-controls" aria-label="Trip preferences">
        <div className="section-label"><span>01</span><h2>{t.region}</h2></div>
        <label className="switch-row">{t.multi}<input type="checkbox" role="switch" checked={multi} onChange={event => { clearResult(); setMulti(event.target.checked); if (!event.target.checked) setCities([cities[0]]); }} /></label>
        <label className="city-search"><Search size={16} /><input aria-label={t.search} placeholder={t.search} value={query} onChange={event => setQuery(event.target.value)} /></label>
        <div className="city-options">{filteredCities.map(city => <button key={city.code} aria-pressed={cities.includes(city.code)} onClick={() => selectCity(city.code)} className={cities.includes(city.code) ? 'selected' : ''}><span><strong>{city.name}</strong><small>{city.nameKo}</small></span>{cities.includes(city.code) ? <Check size={15} /> : <span className="city-option-dot" />}</button>)}{!filteredCities.length && <p>{t.noResults}</p>}</div>
        <div className="selected-route" aria-label={t.selected}>{cities.map((code, index) => <span key={code}><b>{index + 1}</b>{getCityOption(code).name}</span>)}</div>
        <div className="section-label"><span>02</span><h2>{t.days}</h2></div>
        <div className="segmented">{([1, 2, 3] as const).map(count => <button key={count} aria-pressed={days === count} disabled={count < cities.length} onClick={() => { clearResult(); setDays(count); }}><CalendarDays size={15} />{count} {count === 1 ? 'day' : 'days'}</button>)}</div>
        <div className="section-label"><span>03</span><h2>{t.interests}</h2><small>{interests.length}/3</small></div>
        <div className="interest-options">{themes.map(theme => <label key={theme.code} className={interests.includes(theme.code) ? 'selected' : ''}><input type="checkbox" checked={interests.includes(theme.code)} disabled={!interests.includes(theme.code) && interests.length >= 3} onChange={() => { clearResult(); setInterests(interests.includes(theme.code) ? interests.filter(code => code !== theme.code) : [...interests, theme.code]); }} />{theme.label}</label>)}</div>
        <div className="section-label"><span>04</span><h2>{t.transport}</h2></div>
        <div className="segmented">{[{ code: 'TRANSIT', icon: Train, name: 'Transit' }, { code: 'CAR', icon: Car, name: 'Car' }, { code: 'WALK', icon: Footprints, name: 'Walk' }].map(mode => <button key={mode.code} aria-pressed={transport === mode.code} onClick={() => { clearResult(); setTransport(mode.code as RecommendInput['transportMode']); }}><mode.icon size={16} />{mode.name}</button>)}</div>
        <button className="generate-button" disabled={loading || !interests.length} onClick={() => void generate()}>{loading ? <Loader2 className="spin" size={18} /> : <Route size={18} />}{loading ? t.loading : t.generate}{!loading && <ArrowRight size={18} />}</button>
      </aside>
      <section className="journey-content">
        <div className="map-toolbar"><div><span className="live-dot" /><strong>{cityNames}</strong></div><span>{pkg ? `${pkg.items.length} stops` : 'South Korea'}</span></div>
        <div className="planner-map-wrap"><CityMap items={displayedItems} cityCode={cities[0]} cityCodes={cities} onCitySelect={pkg ? undefined : selectCity} activeItemId={activeItemId} onItemSelect={setActiveItemId} /></div>
        <div className="itinerary-panel">
          {error && <div className="planner-alert" role="alert">{error}<button onClick={() => void generate()}>Try again</button></div>}
          {notice && <div className="planner-notice" role="status">{notice}</div>}
          {loading ? <div className="empty-itinerary"><Loader2 className="spin" size={28} /><h2>{t.loading}</h2><div className="loading-line" /></div> : pkg ? <>
            <div className="itinerary-heading"><div><p className="eyebrow">{days} DAY JOURNEY</p><h2>{t.route}</h2></div><div className="route-actions"><button title={t.save} aria-label={t.save} aria-pressed={saved.some(item => item.packageId === pkg.packageId)} onClick={saveTrip}><Bookmark size={18} /></button><button title={t.share} aria-label={t.share} onClick={() => void shareTrip()}><Share2 size={18} /></button><Link href={`/${lang}/package/${pkg.packageId}`}>Full route <ArrowRight size={15} /></Link></div></div>
            {dataSource === 'local-catalog' && <p className="catalog-note">Regional starter itinerary · opening hours and availability need confirmation.</p>}
            {cities.length > 1 && <p className="catalog-note">Intercity travel is not included in stop times.{cities.includes('jeju') ? ' Jeju requires a flight or ferry.' : ''}</p>}
            {transport === 'WALK' && <p className="catalog-note">Some stops may require local transport. Check directions before departure.</p>}
            {packages.length > 1 && <div className="theme-tabs" aria-label="Itinerary themes">{packages.map((route, index) => <button key={route.packageId} aria-pressed={selected === index} onClick={() => { setSelected(index); setDay(0); setActiveItemId(undefined); }}>{themes.find(theme => theme.code === route.themeCode)?.label}</button>)}</div>}
            <div className="day-tabs" aria-label="Itinerary days"><button aria-pressed={day === 0} onClick={() => setDay(0)}>{t.all}</button>{Array.from({ length: pkg.dayCount || 1 }, (_, index) => <button key={index} aria-pressed={day === index + 1} onClick={() => setDay(index + 1)}>Day {index + 1}</button>)}</div>
            {Array.from({ length: pkg.dayCount || 1 }, (_, index) => index + 1).filter(value => !day || value === day).map(dayNumber => <section className="itinerary-day" key={dayNumber}><div className={`day-label day-${dayNumber}`}><span>{String(dayNumber).padStart(2, '0')}</span><div><h3>{getCityOption(pkg.items.find(item => item.dayNumber === dayNumber)?.cityCode || cities[0]).name}</h3><p>Day {dayNumber} · {pkg.items.filter(item => item.dayNumber === dayNumber).length} stops</p></div></div>
              <ol>{pkg.items.filter(item => item.dayNumber === dayNumber).map((item, index) => <li key={item.id} className={activeItemId === item.id ? 'active-stop' : ''}><span className="stop-number">{index + 1}</span><button className="stop-name" onClick={() => setActiveItemId(item.id)}><span className="stop-period">{item.slotType.toLowerCase()}</span><strong>{item.nameI18n?.[lang] || item.nameI18n?.en || item.nameKo || item.name}</strong><small>{item.nameKo} · {getCityOption(item.cityCode || cities[0]).name}</small></button>{item.lat && item.lng && <a title="Open directions" aria-label={`Directions to ${item.nameKo || item.name}`} href={`https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`} target="_blank" rel="noreferrer"><ExternalLink size={16} /></a>}</li>)}</ol>
            </section>)}
          </> : !loading && <div className="empty-itinerary"><Compass size={32} /><div><h2>{t.empty}</h2><p>{t.emptyText}</p></div><span className="empty-route">{cityNames} <ArrowRight size={18} /></span></div>}
        </div>
      </section>
    </main>
    <footer className="planner-footer"><span>K-Culture / Travel with curiosity.</span><span>Regional cultural itineraries · Map © OpenStreetMap contributors</span></footer>
    {showSaved && <div className="saved-overlay" onClick={() => setShowSaved(false)}><section className="saved-dialog" role="dialog" aria-modal="true" aria-label={t.saved} onClick={event => event.stopPropagation()}><div className="itinerary-heading"><h2>{t.saved}</h2><button aria-label="Close saved trips" onClick={() => setShowSaved(false)}><X size={20} /></button></div>{!saved.length && <p>No saved trips yet.</p>}{saved.map(route => <Link key={route.packageId} href={`/${lang}/package/${route.packageId}`}>{route.cityCodes?.map(code => getCityOption(code).name).join(' + ')}<span>{route.dayCount} days <ArrowRight size={16} /></span></Link>)}</section></div>}
  </div>;
}
