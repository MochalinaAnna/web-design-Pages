import UIComponent from './UIComponent.js';

export default class BigMacWidget extends UIComponent {
    constructor() {
        super('☕ Индекс кофе по странам');
        this.coffeePrices = {
            RUS: 200, // ₽
            USA: 5,   // $
            EUR: 3.5, // €
            CNY: 25,  // ¥
        };
    }

    async render() {
        const wrapper = document.createElement('div');
        wrapper.className = 'widget widget-bigmac';
        wrapper.id = this.id;
        wrapper.innerHTML = `
            <div class="widget-header">
                <span class="widget-title">${this.title}</span>
                <button class="widget-close" aria-label="Закрыть">✕</button>
            </div>
            <div class="widget-body">
                <p class="widget-description">Сколько чашек кофе можно купить на $10?</p>
                <div class="coffee-list" id="coffee-list-${this.id}">
                    Загрузка...
                </div>
                <button class="btn-refresh">
                    <i class="fa-solid fa-rotate"></i> Обновить курсы
                </button>
            </div>
        `;

        this._setupCloseButton(wrapper);
        await this._fetchData(wrapper);
        this._setupRefresh(wrapper);
        return wrapper;
    }

    async _fetchData(wrapper) {
        try {
            // Open Exchange Rates API — бесплатно, без ключа
            const response = await fetch('https://open.er-api.com/v6/latest/USD');
            const data = await response.json();
            const rates = data.rates;

            const coffeeList = wrapper.querySelector(`#coffee-list-${this.id}`);
            if (!coffeeList) return;

            const usdToRub = rates.RUB || 90;
            const usdToEur = rates.EUR || 0.92;
            const usdToCny = rates.CNY || 7.2;

            const countries = [
                { name: '🇷🇺 Россия', cups: Math.floor(10 * usdToRub / this.coffeePrices.RUS) },
                { name: '🇺🇸 США', cups: Math.floor(10 / this.coffeePrices.USA) },
                { name: '🇪🇺 Еврозона', cups: Math.floor(10 * usdToEur / this.coffeePrices.EUR) },
                { name: '🇨🇳 Китай', cups: Math.floor(10 * usdToCny / this.coffeePrices.CNY) },
            ];

            coffeeList.innerHTML = countries.map(c => `
                <div class="coffee-row">
                    <span class="country-name">${c.name}</span>
                    <span class="coffee-cups">${c.cups} ☕</span>
                </div>
            `).join('');
        } catch (error) {
            console.error('BigMacWidget fetch error:', error);
        }
    }

    _setupRefresh(wrapper) {
        const btn = wrapper.querySelector('.btn-refresh');
        if (btn) {
            this._addEventListener(btn, 'click', () => this._fetchData(wrapper));
        }
    }
}