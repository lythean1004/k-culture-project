'use client';

import { useTranslations } from 'next-intl';

interface WeatherWidgetProps {
  currentWeather?: string;
  tempC?: number;
}

export default function WeatherWidget({ currentWeather = 'Clear', tempC = 22 }: WeatherWidgetProps) {
  const t = useTranslations('package');

  // Convert weatherCode to emoji & display text
  const getWeatherInfo = (code: string) => {
    const norm = code.toUpperCase();
    if (norm.includes('RAIN') || norm.includes('SHOWER') || norm.includes('RN')) {
      return { emoji: '🌧️', isRain: true, label: 'Rainy' };
    }
    if (norm.includes('CLOUD') || norm.includes('OVERCAST')) {
      return { emoji: '☁️', isRain: false, label: 'Cloudy' };
    }
    if (norm.includes('SNOW')) {
      return { emoji: '❄️', isRain: false, label: 'Snowy' };
    }
    return { emoji: '☀️', isRain: false, label: 'Clear' };
  };

  const weather = getWeatherInfo(currentWeather);

  return (
    <div className="bg-slate-900/60 border border-slate-800 backdrop-blur-md rounded-xl p-4 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3">
        <span className="text-3xl animate-bounce duration-1000">{weather.emoji}</span>
        <div>
          <h4 className="text-sm font-semibold text-slate-400">{t('weatherPrompt')}</h4>
          <p className="text-lg font-bold text-slate-100">{weather.label} ({tempC}°C)</p>
        </div>
      </div>
      <div className="text-right text-xs max-w-[200px]">
        {weather.isRain ? (
          <p className="text-amber-400 font-medium">
            ⚠️ {t('weatherHintIndoor')}
          </p>
        ) : (
          <p className="text-slate-400 leading-normal">
            ✨ {t('weatherHintClear')}
          </p>
        )}
      </div>
    </div>
  );
}
