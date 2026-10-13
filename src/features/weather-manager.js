/**
 * Moreno Horizon Spa & Resort - Weather Manager Feature Module
 * Handles weather data fetching, caching, and rendering.
 */

export class WeatherManager {
    constructor() {
        this.cacheKey = 'moreno_weather_cache';
        this.cacheTtl = 30 * 60 * 1000; // 30 minutes
        this.weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=27.2579&longitude=33.8116&current=temperature_2m,weather_code&daily=uv_index_max,sunrise,sunset&timezone=Africa%2FCairo&forecast_days=1';
        this.marineUrl = 'https://marine-api.open-meteo.com/v1/marine?latitude=27.2579&longitude=33.8116&current=wave_height,sea_surface_temperature&timezone=Africa%2FCairo';
        this.interval = null;
    }

    // Read weather cache from localStorage
    readWeatherCache() {
        try {
            const cached = JSON.parse(localStorage.getItem(this.cacheKey) || 'null');
            return cached && Number.isFinite(cached.fetchedAt) ? cached : null;
        } catch {
            return null;
        }
    }

    // Format weather time
    formatWeatherTime(value, locale) {
        if (!value) return '—';
        const match = value.match(/T(\d{2}):(\d{2})/);
        if (!match) return '—';
        const date = new Date(Date.UTC(2000, 0, 1, Number(match[1]), Number(match[2])));
        return new Intl.DateTimeFormat(locale, {
            timeZone: 'UTC',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(date);
    }

    // Render weather data to UI
    renderWeather(data = this.readWeatherCache(), lang = 'ar') {
        const locale = { ar: 'ar-EG', en: 'en-GB', ru: 'ru-RU', de: 'de-DE' }[lang] || 'ar-EG';
        const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : i18n?.ar;

        const values = {
            wvalTemp: document.getElementById('wvalTemp'),
            wvalSea: document.getElementById('wvalSea'),
            wvalUv: document.getElementById('wvalUv'),
            wvalSunset: document.getElementById('wvalSunset'),
            weatherStatus: document.getElementById('weatherStatus')
        };

        if (!data) {
            Object.values(values).slice(0, 4).forEach(el => {
                if (el) el.innerText = '—';
            });
            if (values.weatherStatus && t) values.weatherStatus.innerText = t.weather_unavailable;
            return;
        }

        const number = value => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);

        let condition = '';
        if (t) {
            condition = data.weatherCode === 0 ? t.weather_clear :
                ([1, 2].includes(data.weatherCode) ? t.weather_partly_cloudy :
                    (data.weatherCode === 3 ? t.weather_cloudy :
                        (data.weatherCode >= 45 && data.weatherCode <= 48 ? t.weather_fog :
                            (data.weatherCode >= 95 ? t.weather_storm : t.weather_rain))));
        }

        if (values.wvalTemp && t) {
            values.wvalTemp.innerText = t.weather_temperature
                .replace('{temp}', number(data.temperatureC))
                .replace('{condition}', condition);
        }

        const seaReadings = [];
        if (Number.isFinite(data.waveHeight) && t) seaReadings.push(t.weather_wave.replace('{value}', number(data.waveHeight)));
        if (Number.isFinite(data.seaTemperatureC) && t) seaReadings.push(t.weather_sea_temp.replace('{value}', number(data.seaTemperatureC)));
        if (values.wvalSea) values.wvalSea.innerText = seaReadings.join(' • ') || '—';

        if (values.wvalUv && t) values.wvalUv.innerText = Number.isFinite(data.uvMax) ? t.weather_uv.replace('{value}', number(data.uvMax)) : '—';
        if (values.wvalSunset) values.wvalSunset.innerText = this.formatWeatherTime(data.sunset, locale);

        if (values.weatherStatus && t) {
            const updatedTime = new Intl.DateTimeFormat(locale, {
                timeZone: 'Africa/Cairo',
                hour: '2-digit',
                minute: '2-digit'
            }).format(new Date(data.fetchedAt));
            const isStale = Date.now() - data.fetchedAt > this.cacheTtl;
            values.weatherStatus.innerText = isStale ? t.weather_cached.replace('{time}', updatedTime) : t.weather_updated.replace('{time}', updatedTime);
        }
    }

    // Fetch fresh weather data
    async refreshWeather(lang = 'ar') {
        const cached = this.readWeatherCache();
        if (cached) this.renderWeather(cached, lang);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 9000);

        try {
            const responses = await Promise.all([
                fetch(this.weatherUrl, { signal: controller.signal, cache: 'no-store' }),
                fetch(this.marineUrl, { signal: controller.signal, cache: 'no-store' })
            ]);

            if (responses.some(response => !response.ok)) throw new Error('Weather service unavailable');

            const [weather, marine] = await Promise.all(responses.map(response => response.json()));

            if (!weather.current || !weather.daily || !marine.current) throw new Error('Incomplete weather response');

            const data = {
                temperatureC: weather.current.temperature_2m,
                weatherCode: weather.current.weather_code,
                uvMax: weather.daily.uv_index_max?.[0],
                sunrise: weather.daily.sunrise?.[0],
                sunset: weather.daily.sunset?.[0],
                waveHeight: marine.current.wave_height,
                seaTemperatureC: marine.current.sea_surface_temperature,
                fetchedAt: Date.now()
            };

            try {
                localStorage.setItem(this.cacheKey, JSON.stringify(data));
            } catch {
                /* Weather remains available for this page view */
            }

            this.renderWeather(data, lang);
        } catch {
            this.renderWeather(cached, lang);
        } finally {
            clearTimeout(timeout);
        }
    }

    // Start auto-refresh
    startAutoRefresh(intervalMs = 15 * 60 * 1000, lang = 'ar') {
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(() => this.refreshWeather(lang), intervalMs);
    }

    // Stop auto-refresh
    stopAutoRefresh() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}

// Create a singleton instance for backward compatibility
export const weatherManager = new WeatherManager();
export default WeatherManager;