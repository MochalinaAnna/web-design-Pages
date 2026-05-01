import UIComponent from './UIComponent.js';

export default class WorldBankWidget extends UIComponent {
    constructor() {
        super('📈 Мировая экономика');
        // Доступные индикаторы с их источниками
        this.indicators = [
            { name: 'Население мира', source: 'countries' },
            { name: 'Средняя площадь страны', source: 'countries' },
            { name: 'Капитализация Bitcoin', source: 'coingecko' },
            { name: 'Курс ETH к USD', source: 'coingecko' },
            { name: 'Всего стран в мире', source: 'countries' },
            { name: 'Общая площадь суши', source: 'countries' },
        ];
        this.currentIndicator = null;
    }

    async render() {
        this.currentIndicator = this.indicators[Math.floor(Math.random() * this.indicators.length)];

        const wrapper = document.createElement('div');
        wrapper.className = 'widget widget-worldbank';
        wrapper.id = this.id;
        wrapper.innerHTML = `
            <div class="widget-header">
                <span class="widget-title">${this.title}</span>
                <button class="widget-close" aria-label="Закрыть">✕</button>
            </div>
            <div class="widget-body">
                <div class="indicator-card" id="indicator-${this.id}">
                    <p>Загрузка данных...</p>
                </div>
                <button class="btn-refresh">
                    <i class="fa-solid fa-shuffle"></i> Другой показатель
                </button>
            </div>
        `;

        this._setupCloseButton(wrapper);
        await this._fetchData(wrapper);
        this._setupRefresh(wrapper);
        return wrapper;
    }

    async _fetchData(wrapper) {
        const indicator = this.currentIndicator;
        const card = wrapper.querySelector(`#indicator-${this.id}`);
        
        if (!card) return;
        card.innerHTML = '<p>⏳ Загрузка...</p>';

        try {
            switch (indicator.source) {
                case 'countries':
                    await this._fetchCountriesData(card, indicator);
                    break;
                case 'coingecko':
                    await this._fetchCryptoData(card, indicator);
                    break;
                default:
                    throw new Error('Неизвестный источник');
            }
        } catch (error) {
            console.error('[WorldWidget] Ошибка:', error);
            card.innerHTML = `
                <span class="indicator-label">${indicator.name}</span>
                <span class="indicator-value">—</span>
                <span class="indicator-year">Нет данных</span>
                <small style="color: var(--text-secondary); display: block; margin-top: 0.5rem;">Не удалось загрузить</small>
            `;
        }
    }

    /**
     * Данные из REST Countries API (уже проверен — работает)
     */
    async _fetchCountriesData(card, indicator) {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,population,area');
        const countries = await response.json();
        
        let value, formattedValue;

        switch (indicator.name) {
            case 'Население мира':
                value = countries.reduce((sum, c) => sum + c.population, 0);
                formattedValue = `${(value / 1_000_000_000).toFixed(2)} млрд чел`;
                break;
            case 'Средняя площадь страны':
                const totalArea = countries.reduce((sum, c) => sum + (c.area || 0), 0);
                value = totalArea / countries.length;
                formattedValue = `${value.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} км²`;
                break;
            case 'Всего стран в мире':
                value = countries.length;
                formattedValue = `${value} стран`;
                break;
            case 'Общая площадь суши':
                value = countries.reduce((sum, c) => sum + (c.area || 0), 0);
                formattedValue = `${(value / 1_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн км²`;
                break;
            default:
                formattedValue = 'Н/Д';
        }

        card.innerHTML = `
            <span class="indicator-label">${indicator.name}</span>
            <span class="indicator-value">${formattedValue}</span>
            <span class="indicator-year">По данным ${new Date().getFullYear()} года</span>
        `;
    }

    /**
     * Данные из CoinGecko API (уже проверен — работает)
     */
    async _fetchCryptoData(card, indicator) {
        let url;
        
        switch (indicator.name) {
            case 'Капитализация Bitcoin':
                url = 'https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&community_data=false&developer_data=false';
                break;
            case 'Курс ETH к USD':
                url = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';
                break;
            default:
                throw new Error('Неизвестный криптоиндикатор');
        }

        const response = await fetch(url);
        const data = await response.json();
        
        let formattedValue;

        if (indicator.name === 'Капитализация Bitcoin') {
            const marketCap = data.market_data?.market_cap?.usd;
            formattedValue = marketCap 
                ? `${(marketCap / 1_000_000_000_000).toFixed(2)} трлн $`
                : 'Н/Д';
        } else if (indicator.name === 'Курс ETH к USD') {
            const price = data.ethereum?.usd;
            formattedValue = price 
                ? `$${price.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}`
                : 'Н/Д';
        }

        card.innerHTML = `
            <span class="indicator-label">${indicator.name}</span>
            <span class="indicator-value">${formattedValue}</span>
            <span class="indicator-year">Данные реального времени</span>
        `;
    }

    _setupRefresh(wrapper) {
        const btn = wrapper.querySelector('.btn-refresh');
        if (btn) {
            this._addEventListener(btn, 'click', async () => {
                // Выбираем новый случайный индикатор
                this.currentIndicator = this.indicators[Math.floor(Math.random() * this.indicators.length)];
                // Обновляем заголовок виджета
                const titleEl = wrapper.querySelector('.widget-title');
                if (titleEl) titleEl.textContent = `📈 ${this.currentIndicator.name}`;
                await this._fetchData(wrapper);
            });
        }
    }
}