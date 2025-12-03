// script.js

// --- ЗМІННІ ---
const input = document.getElementById('ingredient-input');
const tagsContainer = document.getElementById('tags-container');
const searchBtn = document.getElementById('search-btn');
const resultsContainer = document.getElementById('results-container');

// Елементи модального вікна
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalIngredients = document.getElementById('modal-ingredients');
const modalInstructions = document.getElementById('modal-instructions');
const closeModalX = document.getElementById('close-modal');
const closeModalBtn = document.getElementById('close-modal-btn');

// Масив для зберігання інгредієнтів
let ingredients = [];

// --- ЛОГІКА ТЕГІВ ---

// Додавання інгредієнта при натисканні Enter
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const value = input.value.trim();
        if (value && !ingredients.includes(value)) {
            ingredients.push(value);
            renderTags();
            input.value = ''; // Очистити поле
        }
    }
});

// Функція для відображення тегів
function renderTags() {
    tagsContainer.innerHTML = '';
    ingredients.forEach((ing, index) => {
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.innerHTML = `
            ${ing} 
            <span onclick="removeTag(${index})">&times;</span>
        `;
        tagsContainer.appendChild(tag);
    });
}

// Видалення тегу (має бути глобальним, щоб HTML бачив його)
window.removeTag = (index) => {
    ingredients.splice(index, 1);
    renderTags();
};

// --- ЛОГІКА ПОШУКУ (API) ---

searchBtn.addEventListener('click', async () => {
    if (ingredients.length === 0) {
        alert('Будь ласка, додайте хоча б один інгредієнт!');
        return;
    }

    resultsContainer.innerHTML = '<p class="text-center w-full text-gray-500 col-span-2">⏳ Шукаю найкращі рецепти...</p>';

    try {
        // Формуємо рядок запиту: ?ingredients=яйця,молоко
        const queryParams = ingredients.join(',');
        
        // !!! ВАЖЛИВО: Переконайся, що твій NestJS запущено на порту 3000
        const response = await fetch(`http://localhost:3000/recipes/search?ingredients=${queryParams}`);
        
        if (!response.ok) throw new Error('Помилка сервера');

        const data = await response.json();

        // Припускаємо, що бекенд повертає об'єкт { recipes: [...] }
        // Якщо повертає просто масив, зміни на data.forEach
        const recipes = data.recipes || []; 

        displayRecipes(recipes);

    } catch (error) {
        console.error(error);
        resultsContainer.innerHTML = `
            <div class="col-span-2 text-center text-red-500">
                <p>Не вдалося знайти рецепти або сервер не відповідає.</p>
                <p class="text-xs text-gray-400 mt-2">Перевір, чи запущено бекенд (npm run start)</p>
            </div>`;
    }
});

// Функція для малювання карток рецептів
function displayRecipes(recipesList) {
    resultsContainer.innerHTML = '';

    if (recipesList.length === 0) {
        resultsContainer.innerHTML = '<p class="text-center w-full text-gray-500 col-span-2">На жаль, нічого не знайдено 😔</p>';
        return;
    }

    recipesList.forEach(recipe => {
        // Створюємо картку
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition recipe-card border border-orange-100 flex flex-col';
        
        // Якщо у рецепта є картинка (перевір, яке поле повертає API, тут приклад 'image')
        const imageHtml = recipe.image 
            ? `<img src="${recipe.image}" alt="${recipe.title}" class="w-full h-40 object-cover">` 
            : `<div class="w-full h-40 bg-orange-200 flex items-center justify-center text-orange-500">🍲 Немає фото</div>`;

        card.innerHTML = `
            ${imageHtml}
            <div class="p-5 flex flex-col flex-grow">
                <h3 class="font-bold text-lg text-gray-800 mb-2">${recipe.title}</h3>
                <p class="text-sm text-gray-600 line-clamp-2 flex-grow mb-4">
                    ${recipe.description || 'Опис відсутній...'}
                </p>
                <button 
                    class="w-full bg-orange-100 text-orange-600 py-2 rounded-lg hover:bg-orange-200 transition font-medium text-sm"
                    onclick='openModal(${JSON.stringify(recipe).replace(/'/g, "&apos;")})'
                >
                    Детальніше
                </button>
            </div>
        `;
        resultsContainer.appendChild(card);
    });
}

// --- ЛОГІКА МОДАЛЬНОГО ВІКНА ---

window.openModal = (recipe) => {
    modalTitle.innerText = recipe.title;
    
    // Очищення та заповнення інгредієнтів
    modalIngredients.innerHTML = '';
    // Якщо API повертає інгредієнти як масив рядків або об'єктів
    const ingArray = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    
    if (ingArray.length > 0) {
        ingArray.forEach(ing => {
            const li = document.createElement('li');
            // Якщо інгредієнт це об'єкт (напр {name: 'salt', amount: '1 tsp'}), адаптуй тут:
            li.textContent = (typeof ing === 'string') ? ing : `${ing.name} ${ing.amount || ''}`;
            modalIngredients.appendChild(li);
        });
    } else {
        modalIngredients.innerHTML = '<li>Інформація про інгредієнти відсутня</li>';
    }

    modalInstructions.innerText = recipe.instructions || 'Інструкція відсутня.';
    
    // Показуємо вікно
    modalOverlay.classList.remove('hidden');
};

function closeModal() {
    modalOverlay.classList.add('hidden');
}

closeModalX.addEventListener('click', closeModal);
closeModalBtn.addEventListener('click', closeModal);

// Закриття при кліку за межами вікна
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        closeModal();
    }
});