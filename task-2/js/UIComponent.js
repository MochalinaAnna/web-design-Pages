export default class UIComponent {
    constructor(title, id = null) {
        this.title = title;
        this.id = id || `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this._listeners = []; // хранилище для очистки
    }

    /**
     * Возвращает готовый DOM-элемент виджета.
     * Должен быть переопределён в дочерних классах.
     */
    render() {
        const wrapper = document.createElement('div');
        wrapper.className = 'widget';
        wrapper.id = this.id;
        wrapper.innerHTML = `
            <div class="widget-header">
                <span class="widget-title">${this.title}</span>
                <button class="widget-close" aria-label="Закрыть">✕</button>
            </div>
            <div class="widget-body">
                <p>Пустой виджет</p>
            </div>
        `;
        return wrapper;
    }

    /**
     * Удаляет виджет из DOM и очищает все слушатели.
     */
    destroy() {
        // Очищаем сохранённые слушатели
        this._listeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this._listeners = [];

        // Удаляем DOM-элемент
        const element = document.getElementById(this.id);
        if (element) {
            element.remove();
        }
    }

    /**
     * Безопасно вешает обработчик и сохраняет его для последующей очистки.
     */
    _addEventListener(element, event, handler) {
        element.addEventListener(event, handler);
        this._listeners.push({ element, event, handler });
    }

    /**
     * Добавляет кнопку закрытия любому виджету.
     */
    _setupCloseButton(wrapper) {
        const closeBtn = wrapper.querySelector('.widget-close');
        if (closeBtn) {
            this._addEventListener(closeBtn, 'click', () => this.destroy());
        }
    }
}