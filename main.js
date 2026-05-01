import Dashboard from './js/Dashboard.js';

document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new Dashboard('dashboard-grid');

    // Добавление виджетов по кнопкам
    document.querySelectorAll('.btn-add').forEach(button => {
        button.addEventListener('click', () => {
            const widgetType = button.dataset.widget;
            dashboard.addWidget(widgetType);
        });
    });

    // Добавляем один виджет по умолчанию для красоты
    dashboard.addWidget('crypto');
});