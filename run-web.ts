const express = require('express');
const path = require('path');
const app = express();
const PORT = 1332;

// Настройка middleware для статических файлов
app.use(express.static(path.join(__dirname)));  // Разрешаем доступ ко ВСЕМ файлам в текущей директории

// Обработка корневого маршрута
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 Server successfully worker on http://0.0.0.0:${PORT}`);
    console.log(`📁 Work dir: ${__dirname}`);
    console.log('🛑 Work dir: Ctrl+C');
});