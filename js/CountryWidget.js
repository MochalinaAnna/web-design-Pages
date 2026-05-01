import UIComponent from './UIComponent.js';

export default class CountryWidget extends UIComponent {
    constructor() {
        super('🌍 ВВП на душу населения');
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
                    Загрузка...
                </div>
                <button class="btn-refresh">
                    <i class="fa-solid fa-shuffle"></i> Случайная страна
                </button>
            </div>
        `;

        this._setupCloseButton(wrapper);
        await this._fetchRandomCountry(wrapper);
        this._setupRefresh(wrapper);
        return wrapper;
    }

    async _fetchRandomCountry(wrapper) {
        try {
            // REST Countries API — бесплатно, без ключа
            const response = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,population,area,capital');
            const countries = await response.json();

            const random = countries[Math.floor(Math.random() * countries.length)];

            const density = (random.population / random.area).toFixed(1);

            const card = wrapper.querySelector(`#country-card-${this.id}`);
            if (card) {
                card.innerHTML = `
                    <img src="${random.flags.svg}" alt="Флаг ${random.name.common}" class="country-flag">
                    <h3>${random.name.common}</h3>
                    <p>🏙️ Столица: ${random.capital ? random.capital[0] : '—'}</p>
                    <p>👥 Население: ${(random.population / 1_000_000).toFixed(1)} млн</p>
                    <p>📐 Площадь: ${random.area.toLocaleString('ru-RU')} км²</p>
                    <p>📊 Плотность: ${density} чел/км²</p>
                `;
            }
        } catch (error) {
            console.error('CountryWidget fetch error:', error);
        }
    }

    _setupRefresh(wrapper) {
        const btn = wrapper.querySelector('.btn-refresh');
        if (btn) {
            this._addEventListener(btn, 'click', () => this._fetchRandomCountry(wrapper));
        }
    }
}