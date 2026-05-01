import UIComponent from './UIComponent.js';

export default class CountryWidget extends UIComponent {
    constructor() {
        super('🍔 Индекс Биг-Мака');
        this.bigMacPriceUSD = 5.69; // Цена Биг-Мака в США (The Economist, 2024)
    }

    async render() {
        const wrapper = document.createElement('div');
        wrapper.className = 'widget widget-country';
        wrapper.id = this.id;
        wrapper.innerHTML = `
            <div class="widget-header">
                <span class="widget-title">${this.title}</span>
                <button class="widget-close" aria-label="Закрыть">✕</button>
            </div>
            <div class="widget-body">
                <div class="country-card" id="country-card-${this.id}">
                    <p>Загрузка данных...</p>
                </div>
                <button class="btn-refresh">
                    <i class="fa-solid fa-shuffle"></i> Случайная страна
                </button>
            </div>
        `;

        this._setupCloseButton(wrapper);
        await this._fetchCountryData(wrapper);
        this._setupRefresh(wrapper);
        return wrapper;
    }

    async _fetchCountryData(wrapper) {
        const card = wrapper.querySelector(`#country-card-${this.id}`);
        if (!card) return;

        card.innerHTML = '<p>⏳ Загрузка данных о стране...</p>';

        try {
            // 1. Получаем случайную страну
            const countryResponse = await fetch(
                'https://restcountries.com/v3.1/all?fields=name,flags,population,area,capital,currencies,continents,cca3'
            );
            const countries = await countryResponse.json();
            const country = countries[Math.floor(Math.random() * countries.length)];

            // Данные страны
            const countryName = country.name.common;
            const countryCode = country.cca3; // Трёхбуквенный код (RUS, USA и т.д.)
            const population = country.population || 0;
            const area = country.area || 0;
            const density = area > 0 ? (population / area).toFixed(1) : '—';
            const continents = country.continents?.join(', ') || '';
            const capital = country.capital?.[0] || '—';

            // Валюта
            let currencyCode = null;
            let currencyName = 'неизвестно';
            if (country.currencies) {
                const codes = Object.keys(country.currencies);
                if (codes.length > 0) {
                    currencyCode = codes[0];
                    currencyName = country.currencies[codes[0]].name || currencyCode;
                }
            }

            // 2. Получаем реальный ВВП на душу через World Bank API (через CORS-прокси)
            card.innerHTML = '<p>⏳ Загружаю ВВП...</p>';
            
            let gdpPerCapita = await this._fetchGDPPerCapita(countryCode);

            // Если ВВП не найден — пробуем через название страны
            if (!gdpPerCapita) {
                gdpPerCapita = await this._fetchGDPByCountryName(countryName);
            }

            // 3. Получаем курс валюты
            let exchangeRate = null;
            if (currencyCode) {
                try {
                    const rateResponse = await fetch('https://open.er-api.com/v6/latest/USD');
                    const rateData = await rateResponse.json();
                    exchangeRate = rateData.rates?.[currencyCode] || null;
                } catch (e) {
                    console.warn('Не удалось получить курс валюты:', e);
                }
            }

            // 4. Если ВВП всё ещё нет — оцениваем по региону
            if (!gdpPerCapita || gdpPerCapita <= 0) {
                gdpPerCapita = this._estimateGDP(continents);
            }

            // 5. Рассчитываем Индекс Биг-Мака
            // Формула: сколько Биг-Маков можно купить на месячный ВВП на душу
            const monthlyGDP = gdpPerCapita / 12;
            const bigMacIndex = Math.floor(monthlyGDP / this.bigMacPriceUSD);

            // 6. Форматируем
            const formattedGDP = gdpPerCapita >= 1000
                ? `$${(gdpPerCapita / 1000).toFixed(1)} тыс`
                : `$${gdpPerCapita.toFixed(0)}`;

            const formattedPopulation = population >= 1_000_000
                ? `${(population / 1_000_000).toFixed(1)} млн`
                : population.toLocaleString('ru-RU');

            const formattedArea = area >= 1_000_000
                ? `${(area / 1_000_000).toFixed(1)} млн км²`
                : `${area.toLocaleString('ru-RU')} км²`;

            const rateInfo = exchangeRate && currencyCode
                ? `1 USD = ${exchangeRate.toFixed(2)} ${currencyCode}`
                : 'курс не найден';

            // 7. Отрисовка
            card.innerHTML = `
                <img src="${country.flags.svg}" alt="Флаг ${countryName}" class="country-flag">
                <h3>${countryName}</h3>
                ${continents ? `<p class="country-continent">${continents}</p>` : ''}
                
                <div class="country-stats">
                    <div class="stat-row">
                        <span class="stat-label">🏙️ Столица</span>
                        <span class="stat-value">${capital}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">👥 Население</span>
                        <span class="stat-value">${formattedPopulation}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">📐 Площадь</span>
                        <span class="stat-value">${formattedArea}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">📊 Плотность</span>
                        <span class="stat-value">${density} чел/км²</span>
                    </div>
                    <div class="stat-row stat-highlight">
                        <span class="stat-label">💰 ВВП на душу (год)</span>
                        <span class="stat-value">${formattedGDP}</span>
                    </div>
                    <div class="stat-row stat-highlight">
                        <span class="stat-label">💵 Валюта</span>
                        <span class="stat-value">${currencyCode || '—'}</span>
                    </div>
                </div>

                <div class="bigmac-index">
                    <div class="bigmac-header">
                        <span class="burger-icon">🍔</span>
                        <span>Индекс Биг-Мака</span>
                    </div>
                    <div class="bigmac-value">${bigMacIndex.toLocaleString('ru-RU')}</div>
                    <div class="bigmac-unit">Биг-Маков в месяц</div>
                    <div class="bigmac-desc">
                        На среднюю зарплату можно купить ${bigMacIndex} Биг-Маков<br>
                        <small>🍔 = $${this.bigMacPriceUSD} | ${rateInfo}</small>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('[CountryWidget] Ошибка:', error);
            card.innerHTML = '<p>❌ Не удалось загрузить данные. Попробуйте снова.</p>';
        }
    }

    /**
     * Получает ВВП на душу населения через World Bank API (через CORS-прокси)
     */
    async _fetchGDPPerCapita(countryCode) {
        try {
            // Используем CORS-прокси для обхода блокировки
            const proxyUrl = 'https://api.allorigins.win/raw?url=';
            const apiUrl = encodeURIComponent(
                `https://api.worldbank.org/v2/country/${countryCode}/indicator/NY.GDP.PCAP.CD?format=json&per_page=1&mrnev=1`
            );
            
            const response = await fetch(proxyUrl + apiUrl);
            if (!response.ok) return null;
            
            const data = await response.json();
            
            if (data && data[1] && data[1][0] && data[1][0].value) {
                return data[1][0].value;
            }
            return null;
        } catch (e) {
            console.warn(`Не удалось получить ВВП для ${countryCode}:`, e.message);
            return null;
        }
    }

    /**
     * Запасной метод: ищем ВВП через API всех стран
     */
    async _fetchGDPByCountryName(countryName) {
        try {
            const proxyUrl = 'https://api.allorigins.win/raw?url=';
            const apiUrl = encodeURIComponent(
                `https://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.CD?format=json&per_page=300&mrnev=1`
            );
            
            const response = await fetch(proxyUrl + apiUrl);
            if (!response.ok) return null;
            
            const data = await response.json();
            
            if (data && data[1]) {
                const record = data[1].find(r => 
                    r && r.country?.value?.toLowerCase() === countryName.toLowerCase() && r.value
                );
                if (record) return record.value;
            }
            return null;
        } catch (e) {
            console.warn('Не удалось найти ВВП по названию страны:', e.message);
            return null;
        }
    }

    /**
     * Оценка ВВП по региону, если API не дал данных
     */
    _estimateGDP(continents) {
        const regionalGDP = {
            'Europe': 35000,
            'North America': 45000,
            'South America': 9000,
            'Asia': 8000,
            'Africa': 2500,
            'Oceania': 30000,
            'Antarctica': 0,
        };

        // Ищем первый подходящий континент
        for (const [continent, gdp] of Object.entries(regionalGDP)) {
            if (continents.includes(continent)) return gdp;
        }

        // Если не нашли — среднемировой
        return 13000;
    }

    _setupRefresh(wrapper) {
        const btn = wrapper.querySelector('.btn-refresh');
        if (btn) {
            this._addEventListener(btn, 'click', () => this._fetchCountryData(wrapper));
        }
    }
}