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

        card.innerHTML = '<p>⏳ Загрузка...</p>';

        try {
            // 1. Получаем случайную страну (REST Countries API — работает без CORS)
            const countryResponse = await fetch(
                'https://restcountries.com/v3.1/all?fields=name,flags,population,area,capital,currencies,gdp,continents'
            );
            const countries = await countryResponse.json();
            const country = countries[Math.floor(Math.random() * countries.length)];

            // Определяем код валюты (берём первую, если несколько)
            let currencyCode = null;
            let currencyName = 'неизвестно';
            
            if (country.currencies) {
                const codes = Object.keys(country.currencies);
                if (codes.length > 0) {
                    currencyCode = codes[0];
                    currencyName = country.currencies[codes[0]].name || currencyCode;
                }
            }

            // 2. Получаем курсы валют (Open Exchange Rates API — работает без CORS)
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

            // 3. Вычисляем показатели
            const population = country.population || 0;
            const area = country.area || 0;
            const density = area > 0 ? (population / area).toFixed(1) : '—';
            
            // ВВП на душу населения (есть в API не у всех стран, поэтому рассчитываем)
            let gdpPerCapita = null;
            
            // Пробуем получить из gdp полей
            if (country.gdp) {
                // gdp — объект с ключами валют
                const gdpValues = Object.values(country.gdp);
                if (gdpValues.length > 0 && population > 0) {
                    gdpPerCapita = gdpValues[0] / population;
                }
            }

            // Если ВВП не нашёлся — берём примерный средний
            if (!gdpPerCapita || isNaN(gdpPerCapita)) {
                // Среднемировой ВВП на душу ~$13,000 (2023)
                gdpPerCapita = 13000;
            }

            // 4. Рассчитываем Индекс Биг-Мака
            let bigMacIndex = null;
            let bigMacDescription = '';

            if (exchangeRate && currencyCode) {
                // Цена Биг-Мака в местной валюте
                const localBigMacPrice = this.bigMacPriceUSD * exchangeRate;
                // Сколько Биг-Маков можно купить на месячный ВВП на душу
                const monthlyGDP = gdpPerCapita / 12;
                bigMacIndex = Math.floor(monthlyGDP / localBigMacPrice);
                bigMacDescription = `по курсу: $1 = ${exchangeRate.toFixed(2)} ${currencyCode}`;
            } else {
                // Если курс неизвестен — считаем в USD напрямую
                const monthlyGDP = gdpPerCapita / 12;
                bigMacIndex = Math.floor(monthlyGDP / this.bigMacPriceUSD);
                bigMacDescription = 'расчёт в USD (курс локальной валюты не найден)';
            }

            // Форматирование для отображения
            const formattedGDP = gdpPerCapita >= 1000 
                ? `$${(gdpPerCapita / 1000).toFixed(1)} тыс`
                : `$${gdpPerCapita.toFixed(0)}`;

            const formattedPopulation = population >= 1_000_000
                ? `${(population / 1_000_000).toFixed(1)} млн`
                : population.toLocaleString('ru-RU');

            const formattedArea = area >= 1_000_000
                ? `${(area / 1_000_000).toFixed(1)} млн км²`
                : `${area.toLocaleString('ru-RU')} км²`;

            // 5. Отрисовываем красивую карточку
            card.innerHTML = `
                <img src="${country.flags.svg}" alt="Флаг ${country.name.common}" class="country-flag">
                <h3>${country.name.common}</h3>
                ${country.continents ? `<p class="country-continent">${country.continents.join(', ')}</p>` : ''}
                
                <div class="country-stats">
                    <div class="stat-row">
                        <span class="stat-label">🏙️ Столица</span>
                        <span class="stat-value">${country.capital ? country.capital[0] : '—'}</span>
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
                        <span class="stat-label">💰 ВВП на душу</span>
                        <span class="stat-value">${formattedGDP}</span>
                    </div>
                    <div class="stat-row stat-highlight">
                        <span class="stat-label">💵 Валюта</span>
                        <span class="stat-value">${currencyCode || '—'} (${currencyName})</span>
                    </div>
                </div>

                <div class="bigmac-index">
                    <div class="bigmac-header">
                        <span class="burger-icon">🍔</span>
                        <span>Индекс Биг-Мака</span>
                    </div>
                    <div class="bigmac-value">${bigMacIndex || '—'}</div>
                    <div class="bigmac-unit">Биг-Маков в месяц</div>
                    <div class="bigmac-desc">${bigMacDescription}</div>
                </div>
            `;
        } catch (error) {
            console.error('[CountryWidget] Ошибка:', error);
            card.innerHTML = '<p>❌ Не удалось загрузить данные. Попробуйте снова.</p>';
        }
    }

    _setupRefresh(wrapper) {
        const btn = wrapper.querySelector('.btn-refresh');
        if (btn) {
            this._addEventListener(btn, 'click', () => this._fetchCountryData(wrapper));
        }
    }
}