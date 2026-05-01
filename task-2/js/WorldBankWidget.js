import UIComponent from './UIComponent.js';

export default class WorldBankWidget extends UIComponent {
    constructor() {
        super('📈 Мировой показатель');
        this.indicators = [
            { code: 'NY.GDP.MKTP.CD', name: 'ВВП (текущий $)', format: 'money' },
            { code: 'SP.POP.TOTL', name: 'Население мира', format: 'people' },
            { code: 'FP.CPI.TOTL.ZG', name: 'Инфляция (%)', format: 'percent' },
            { code: 'SL.UEM.TOTL.ZS', name: 'Безработица (%)', format: 'percent' },
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
                    Загрузка...
                </div>
                <button class="btn-refresh">
                    <i class="fa-solid fa-shuffle"></i> Другой показатель
                </button>
            </div>
        `;

        this._setupCloseButton(wrapper);
        await this._fetchIndicator(wrapper);
        this._setupRefresh(wrapper);
        return wrapper;
    }

    async _fetchIndicator(wrapper) {
        try {
            const indicator = this.currentIndicator;
            // World Bank API — бесплатно, без ключа
            const response = await fetch(
                `https://api.worldbank.org/v2/country/1W/indicator/${indicator.code}?format=json&per_page=1&mrnev=1`
            );
            const data = await response.json();

            const card = wrapper.querySelector(`#indicator-${this.id}`);
            if (!card) return;

            if (data && data[1] && data[1][0] && data[1][0].value) {
                const value = data[1][0].value;
                const year = data[1][0].date;
                let formattedValue;

                switch (indicator.format) {
                    case 'money':
                        formattedValue = `${(value / 1_000_000_000_000).toFixed(2)} трлн $`;
                        break;
                    case 'people':
                        formattedValue = `${(value / 1_000_000_000).toFixed(2)} млрд чел`;
                        break;
                    case 'percent':
                        formattedValue = `${value.toFixed(2)}%`;
                        break;
                    default:
                        formattedValue = value.toLocaleString('ru-RU');
                }

                card.innerHTML = `
                    <span class="indicator-label">${indicator.name}</span>
                    <span class="indicator-value">${formattedValue}</span>
                    <span class="indicator-year">${year} год</span>
                `;
            } else {
                card.innerHTML = '<p>Нет данных</p>';
            }
        } catch (error) {
            console.error('WorldBankWidget fetch error:', error);
        }
    }

    _setupRefresh(wrapper) {
        const btn = wrapper.querySelector('.btn-refresh');
        if (btn) {
            this._addEventListener(btn, 'click', async () => {
                this.currentIndicator = this.indicators[Math.floor(Math.random() * this.indicators.length)];
                // Обновляем заголовок
                const titleEl = wrapper.querySelector('.widget-title');
                if (titleEl) titleEl.textContent = `📈 ${this.currentIndicator.name}`;
                await this._fetchIndicator(wrapper);
            });
        }
    }
}