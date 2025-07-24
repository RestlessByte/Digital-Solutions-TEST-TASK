const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 1333;

app.use(cors());
app.use(bodyParser.json());

// Глобальное состояние (хранится в памяти)
let globalState = {
  order: Array.from({ length: 1000000 }, (_, i) => i + 1),
  selected: new Set()
};

// Генерация данных постранично
app.get('/api/items', (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;
  const pageInt = parseInt(page);
  const limitInt = parseInt(limit);
  const startIndex = (pageInt - 1) * limitInt;

  let items = [];
  let count = 0;
  const searchLower = search.toLowerCase();

  // Фильтрация и сортировка
  for (let i = 0; i < globalState.order.length; i++) {
    const id = globalState.order[i];
    const name = `Item ${id}`;

    if (!search || name.toLowerCase().includes(searchLower)) {
      if (count >= startIndex && items.length < limitInt) {
        items.push({ id, name, selected: globalState.selected.has(id) });
      }
      count++;
    }
  }

  res.json({
    items,
    hasMore: count > startIndex + items.length
  });
});

// Обновление состояния
app.post('/api/state', (req, res) => {
  if (req.body.order) {
    globalState.order = req.body.order;
  }
  if (req.body.selected) {
    globalState.selected = new Set(req.body.selected);
  }
  res.json({ status: 'ok' });
});

// Получение состояния
app.get('/api/state', (req, res) => {
  res.json({
    order: globalState.order,
    selected: Array.from(globalState.selected)
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://84.39.243.205:${PORT}`);
});