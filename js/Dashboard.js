import UIComponent from './UIComponent.js';
import CryptoWidget from './CryptoWidget.js';
import BigMacWidget from './BigMacWidget.js';
import CountryWidget from './CountryWidget.js';
import WorldBankWidget from './WorldBankWidget.js';

export default class Dashboard {
    constructor(gridId) {
        this.grid = document.getElementById(gridId);
        this.widgets = []; // коллекция активных виджетов

        // Связываем методы
        this.addWidget = this.addWidget.bind(this);
        this.removeWidget = this.removeWidget.bind(this);
    }

    /**
     * Добавляет виджет указанного типа.
     * @param {string} widgetType — 'bigmac' | 'crypto' | 'country' | 'worldbank'
     */
    async addWidget(widgetType) {
        let widget;

        switch (widgetType) {
            case 'bigmac':
                widget = new BigMacWidget();
                break;
            case 'crypto':
                widget = new CryptoWidget();
                break;
            case 'country':
                widget = new CountryWidget();
                break;
            case 'worldbank':
                widget = new WorldBankWidget();
                break;
            default:
                console.error(`Неизвестный тип виджета: ${widgetType}`);
                return;
        }

        // Рендерим виджет (await — т.к. render может быть асинхронным)
        const element = await widget.render();

        // Добавляем в DOM
        this.grid.appendChild(element);

        // Сохраняем в коллекцию
        this.widgets.push(widget);

        // Анимация появления
        requestAnimationFrame(() => {
            element.classList.add('widget-visible');
        });

        // Подписываемся на удаление виджета через его destroy
        const originalDestroy = widget.destroy.bind(widget);
        widget.destroy = () => {
            element.classList.remove('widget-visible');
            setTimeout(() => {
                originalDestroy();
                this.removeWidget(widget.id);
            }, 300);
        };
    }

    /**
     * Удаляет виджет из коллекции по ID.
     * @param {string} widgetId
     */
    removeWidget(widgetId) {
        this.widgets = this.widgets.filter(w => w.id !== widgetId);
    }
}