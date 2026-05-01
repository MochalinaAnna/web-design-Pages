import UIComponent from './UIComponent.js';

export default class CryptoWidget extends UIComponent {
    constructor() {
        super('₿ Bitcoin к чашке кофе');
        this.coffeePriceRUB = 200; // средняя цена чашки в России
    }

    async render() {
        const wrapper = document.createElement('div');
        wrapper.className = 'widget widget-crypto';
        wrapper.id = this.id;
        wrapper.innerHTML = `
            <div class="widget-header">
                <span class="widget-title">${this.title}</span>
                <button class="widget-close" aria-label="Закрыть">✕</button>
            </div>
            <div class="widget-body">
                <div class="crypto-display">
                    <div class="crypto-main">
                        <span class="crypto-price">Загрузка...</span>
                        <span class="crypto-label">за 1 BTC</span>
                    </div>
                    <div class="coffee-equivalent">
                        <span class="coffee-icon">☕</span>
                        <span class="coffee-count">...</span>
                        <span class="coffee-label">чашек кофе</span>
                    </div>
                </div>
                <button class="btn-refresh">
                    <i class="fa-solid fa-rotate"></i> Обновить
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
            // CoinGecko API — бесплатно, без ключа
            const response = await fetch(
                'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=rub'
            );
            const data = await response.json();
            const btcPrice = data.bitcoin.rub;

            const cryptoPriceEl = wrapper.querySelector('.crypto-price');
            const coffeeCountEl = wrapper.querySelector('.coffee-count');

            if (cryptoPriceEl && coffeeCountEl) {
                cryptoPriceEl.textContent = `${btcPrice.toLocaleString('ru-RU')} ₽`;
                const cups = Math.floor(btcPrice / this.coffeePriceRUB);
                coffeeCountEl.textContent = cups.toLocaleString('ru-RU');
            }
        } catch (error) {
            const cryptoPriceEl = wrapper.querySelector('.crypto-price');
            if (cryptoPriceEl) {
                cryptoPriceEl.textContent = 'Ошибка';
            }
            console.error('CryptoWidget fetch error:', error);
        }
    }

    _setupRefresh(wrapper) {
        const refreshBtn = wrapper.querySelector('.btn-refresh');
        if (refreshBtn) {
            this._addEventListener(refreshBtn, 'click', () => this._fetchData(wrapper));
        }
    }
}