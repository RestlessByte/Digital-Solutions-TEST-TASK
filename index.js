let currentPage = 1;
let isLoading = false;
let hasMore = true;
let currentSearch = '';
let selectedItems = new Set();
let items = [];
let listElement = null;

document.addEventListener('DOMContentLoaded', init);

function init() {
  listElement = document.getElementById('list');
  const searchInput = document.getElementById('search');
  const resetButton = document.getElementById('reset');

  // Загрузка состояния
  loadState().then(() => {
    loadItems();
  });

  // Поиск
  searchInput.addEventListener('input', e => {
    currentSearch = e.target.value;
    resetList();
    loadItems();
  });

  // Сброс
  resetButton.addEventListener('click', () => {
    fetch('http://localhost:1333/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: Array.from({ length: 1000000 }, (_, i) => i + 1), selected: [] })
    }).then(() => {
      selectedItems.clear();
      updateSelectionCount();
      resetList();
      loadItems();
    });
  });

  // Бесконечный скролл
  listElement.addEventListener('scroll', handleScroll);

  // Инициализация DnD
  initDragAndDrop();
}

function resetList() {
  currentPage = 1;
  items = [];
  listElement.innerHTML = '';
  hasMore = true;
  isLoading = false;
}

async function loadState() {
  const response = await fetch('http://localhost:1333/api/state');
  const state = await response.json();
  selectedItems = new Set(state.selected);
  updateSelectionCount();
}

async function saveState() {
  await fetch('http://localhost:1333/api/state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selected: Array.from(selectedItems)
    })
  });
}

function loadItems() {
  if (isLoading || !hasMore) return;

  isLoading = true;
  showLoading(true);

  const params = new URLSearchParams({
    page: currentPage,
    limit: 20,
    search: currentSearch
  });

  fetch(`http://localhost:1333/api/items?${params}`)
    .then(res => res.json())
    .then(data => {
      items = [...items, ...data.items];
      renderItems(data.items);
      hasMore = data.hasMore;
      currentPage++;
      isLoading = false;
      showLoading(false);
    });
}

function renderItems(newItems) {
  newItems.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.className = 'item';
    itemElement.dataset.id = item.id;
    itemElement.draggable = true;

    itemElement.innerHTML = `
            <div class="item-checkbox">
                <input type="checkbox" ${item.selected ? 'checked' : ''}>
            </div>
            <div class="item-id">${item.id}</div>
            <div class="item-name">${item.name}</div>
        `;

    // Обработка выбора
    const checkbox = itemElement.querySelector('input');
    checkbox.addEventListener('change', e => {
      if (e.target.checked) {
        selectedItems.add(item.id);
      } else {
        selectedItems.delete(item.id);
      }
      updateSelectionCount();
      saveState();
    });

    listElement.appendChild(itemElement);
  });
}

function updateSelectionCount() {
  document.getElementById('selected-count').textContent =
    `Выбрано: ${selectedItems.size}`;
}

function handleScroll() {
  const { scrollTop, scrollHeight, clientHeight } = listElement;
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    loadItems();
  }
}

function showLoading(show) {
  document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function initDragAndDrop() {
  let dragItem = null;

  listElement.addEventListener('dragstart', e => {
    if (e.target.classList.contains('item')) {
      dragItem = e.target;
      setTimeout(() => dragItem.classList.add('dragging'), 0);
    }
  });

  listElement.addEventListener('dragover', e => {
    e.preventDefault();
    if (!dragItem) return;

    const afterElement = getDragAfterElement(e.clientY);
    const currentElement = document.querySelector('.dragging');

    if (afterElement) {
      listElement.insertBefore(currentElement, afterElement);
    } else {
      listElement.appendChild(currentElement);
    }
  });

  listElement.addEventListener('dragend', () => {
    if (!dragItem) return;

    dragItem.classList.remove('dragging');

    // Обновление порядка на сервере
    const newOrder = Array.from(listElement.children)
      .map(el => parseInt(el.dataset.id));

    fetch('http://localhost:1333/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: newOrder })
    });

    dragItem = null;
  });
}

function getDragAfterElement(y) {
  const draggableElements = [...listElement.querySelectorAll('.item:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}