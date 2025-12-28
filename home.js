// Меню для мобилок
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
        if (nav.style.display === 'flex') {
            nav.style.flexDirection = 'column';
            nav.style.position = 'absolute';
            nav.style.top = '100%';
            nav.style.left = '0';
            nav.style.width = '100%';
            nav.style.background = 'white';
            nav.style.padding = '20px';
            nav.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
            nav.style.gap = '20px';
        }
    });
}

// Плавная прокрутка
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 100,
                behavior: 'smooth'
            });
            // Закрываем мобильное меню
            if (window.innerWidth <= 768) {
                nav.style.display = 'none';
            }
        }
    });
});

// ========== УЛУЧШЕННАЯ ЛОГИКА КОРЗИНЫ С РЕДАКТИРОВАНИЕМ ==========
let cart = {};

// Элементы корзины
const miniCartContainer = document.getElementById('miniCart');
const cartBadge = document.querySelector('.cart-badge');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const cartCloseBtn = document.querySelector('.cart-close');
const cartItemsContainer = document.querySelector('.cart-items');
const totalPriceElement = document.querySelector('.total-price');
const checkoutBtn = document.getElementById('checkoutBtn');
const continueShoppingBtn = document.getElementById('continueShopping');

// Проверка видимости секции каталога
function isCatalogVisible() {
    const catalogSection = document.getElementById('catalog');
    if (!catalogSection) return false;
    
    const rect = catalogSection.getBoundingClientRect();
    return (
        rect.top < window.innerHeight - 100 && 
        rect.bottom > 100
    );
}

// Показать/скрыть мини-корзину в зависимости от позиции
function updateMiniCartVisibility() {
    if (isCatalogVisible() || Object.keys(cart).length > 0) {
        miniCartContainer.classList.add('visible');
    } else {
        miniCartContainer.classList.remove('visible');
    }
}

// Загрузка корзины из localStorage
function loadCart() {
    const savedCart = localStorage.getItem('pure_cruft_cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateAllCounters();
        updateCartUI();
    }
}

// Сохранение корзины
function saveCart() {
    localStorage.setItem('pure_cruft_cart', JSON.stringify(cart));
}

// Обновление счётчика для конкретного товара
function updateCounter(productName) {
    const selector = document.querySelector(`.quantity-selector[data-product="${productName}"] .qty-count`);
    if (selector) {
        selector.textContent = cart[productName] || 0;
    }
}

// Обновление всех счётчиков
function updateAllCounters() {
    document.querySelectorAll('.quantity-selector').forEach(selector => {
        const productName = selector.getAttribute('data-product');
        const countElement = selector.querySelector('.qty-count');
        if (countElement) {
            countElement.textContent = cart[productName] || 0;
        }
    });
}

// Обновление бейджа корзины
function updateCartBadge() {
    const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
    cartBadge.textContent = totalItems;
}

// Обновление полной корзины
function updateCartUI() {
    updateCartBadge();
    
    // Очищаем контейнер
    cartItemsContainer.innerHTML = '';
    
    // Если корзина пуста
    if (Object.keys(cart).length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-basket"></i>
                <p>Ваша корзина пуста</p>
                <p>Добавьте товары из каталога</p>
            </div>
        `;
        totalPriceElement.textContent = '0';
        return;
    }
    
    let totalPrice = 0;
    
    // Добавляем товары
    for (const [productName, quantity] of Object.entries(cart)) {
        if (quantity === 0) continue;
        
        // Находим цену товара
        const selector = document.querySelector(`.quantity-selector[data-product="${productName}"]`);
        const price = selector ? parseInt(selector.getAttribute('data-price')) : 0;
        const itemTotal = price * quantity;
        totalPrice += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.setAttribute('data-product', productName);
        cartItem.innerHTML = `
            <div class="item-info">
                <h4>${productName}</h4>
                <div class="item-price">${price} BYN × ${quantity} = <strong>${itemTotal} BYN</strong></div>
            </div>
            <div class="item-controls">
                <button class="qty-btn cart-minus" data-product="${productName}">-</button>
                <input type="number" class="qty-input" value="${quantity}" min="0" max="99" data-product="${productName}">
                <button class="qty-btn cart-plus" data-product="${productName}">+</button>
                <button class="remove-item" data-product="${productName}" title="Удалить">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        cartItemsContainer.appendChild(cartItem);
    }
    
    totalPriceElement.textContent = totalPrice;
    
    // Добавляем обработчики событий для input полей
    document.querySelectorAll('.qty-input').forEach(input => {
        input.addEventListener('change', function() {
            const productName = this.getAttribute('data-product');
            const newQuantity = parseInt(this.value) || 0;
            
            if (newQuantity < 0) {
                this.value = cart[productName] || 0;
                return;
            }
            
            if (newQuantity === 0) {
                delete cart[productName];
                showNotification(`${productName} удален из корзины`, 'warning');
            } else {
                cart[productName] = newQuantity;
                showNotification(`Количество ${productName} изменено на ${newQuantity}`);
            }
            
            // Обновляем счетчик в каталоге
            updateCounter(productName);
            saveCart();
            
            // Перерисовываем корзину
            setTimeout(() => updateCartUI(), 100);
        });
        
        input.addEventListener('blur', function() {
            if (this.value === '' || parseInt(this.value) < 0) {
                this.value = cart[this.getAttribute('data-product')] || 0;
            }
        });
    });
}

// Открытие корзины
function openCart() {
    cartSidebar.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Закрытие корзины
function closeCart() {
    cartSidebar.classList.remove('active');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Добавление товара
function addToCart(productName, price) {
    if (!cart[productName]) {
        cart[productName] = 0;
    }
    cart[productName]++;
    
    updateCounter(productName);
    updateCartUI();
    saveCart();
    showNotification(`Добавлено: ${productName}`);
}

// Удаление товара
function removeFromCart(productName) {
    if (cart[productName]) {
        cart[productName]--;
        if (cart[productName] === 0) {
            delete cart[productName];
        }
        
        updateCounter(productName);
        updateCartUI();
        saveCart();
        showNotification(`Уменьшено: ${productName}`);
    }
}

// Удаление позиции полностью
function removeItemCompletely(productName) {
    if (cart[productName]) {
        delete cart[productName];
        
        updateCounter(productName);
        updateCartUI();
        saveCart();
        showNotification(`Удалено: ${productName}`, 'warning');
    }
}

// Обработка кликов (делегирование событий)
document.addEventListener('click', function(e) {
    // Клик на "+" в каталоге
    if (e.target.classList.contains('plus') && !e.target.classList.contains('cart-plus')) {
        const selector = e.target.closest('.quantity-selector');
        if (!selector) return;
        
        const productName = selector.getAttribute('data-product');
        const price = parseInt(selector.getAttribute('data-price'));
        
        addToCart(productName, price);
    }
    
    // Клик на "-" в каталоге
    if (e.target.classList.contains('minus') && !e.target.classList.contains('cart-minus')) {
        const selector = e.target.closest('.quantity-selector');
        if (!selector) return;
        
        const productName = selector.getAttribute('data-product');
        
        removeFromCart(productName);
    }
    
    // Клик на "+" в корзине (cart-plus)
    if (e.target.classList.contains('cart-plus')) {
        const productName = e.target.getAttribute('data-product');
        const selector = document.querySelector(`.quantity-selector[data-product="${productName}"]`);
        const price = selector ? parseInt(selector.getAttribute('data-price')) : 0;
        
        addToCart(productName, price);
    }
    
    // Клик на "-" в корзине (cart-minus)
    if (e.target.classList.contains('cart-minus')) {
        const productName = e.target.getAttribute('data-product');
        
        removeFromCart(productName);
    }
    
    // Удаление товара из корзины
    if (e.target.classList.contains('remove-item') || e.target.closest('.remove-item')) {
        const button = e.target.classList.contains('remove-item') ? e.target : e.target.closest('.remove-item');
        const productName = button.getAttribute('data-product');
        
        removeItemCompletely(productName);
    }
    
    // Открытие мини-корзины
    if (e.target.closest('.mini-cart-toggle')) {
        openCart();
    }
    
    // Закрытие корзины
    if (e.target === cartOverlay || e.target.classList.contains('cart-close') || 
        e.target.closest('.cart-close') || e.target === continueShoppingBtn) {
        closeCart();
    }
    
    // Кнопка "Оформить заказ" в корзине
    if (e.target === checkoutBtn || e.target.closest('#checkoutBtn')) {
        closeCart();
        
        // Плавный скролл к форме заказа
        const orderForm = document.getElementById('order');
        if (orderForm) {
            e.preventDefault();
            window.scrollTo({
                top: orderForm.offsetTop - 100,
                behavior: 'smooth'
            });
            
            // Подсветка формы
            orderForm.style.transition = 'all 0.5s';
            orderForm.style.boxShadow = '0 0 0 3px #d4a55e';
            setTimeout(() => {
                orderForm.style.boxShadow = '';
            }, 2000);
            
            showNotification('Переходим к оформлению заказа!');
        }
    }
    
    // Кнопка "Заказать выбранное" в каталоге
    if (e.target.classList.contains('order-btn') || e.target.closest('.order-btn')) {
        // Проверяем, есть ли товары в корзине
        const hasItems = Object.keys(cart).length > 0;
        
        if (!hasItems) {
            e.preventDefault();
            showNotification('Сначала выберите товары!', 'warning');
            return;
        }
        
        // Открываем корзину
        openCart();
        e.preventDefault();
    }
});

// Всплывающее уведомление
function showNotification(message, type = 'success') {
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'warning' ? '#ff9800' : '#2a5c3d'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 9999;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 3000);
}

// Анимации для уведомлений
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Форма заказа
const orderForm = document.getElementById('order-form');
if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Получаем выбранные товары
        const selectedItems = [];
        let totalPrice = 0;
        
        for (const [product, quantity] of Object.entries(cart)) {
            if (quantity > 0) {
                const selector = document.querySelector(`.quantity-selector[data-product="${product}"]`);
                const price = selector ? parseInt(selector.getAttribute('data-price')) : 0;
                selectedItems.push(`${product} (${quantity} шт. × ${price} BYN)`);
                totalPrice += price * quantity;
            }
        }
        
        // Добавляем товары в текстовое поле формы
        const textarea = orderForm.querySelector('textarea');
        const originalText = textarea.value;
        const itemsText = selectedItems.length > 0 
            ? `\n\nЗаказ:\n${selectedItems.join('\n')}\n\nИтого: ${totalPrice} BYN` 
            : '';
        
        textarea.value = originalText + itemsText;
        
        alert('Запрос отправлен! Мы свяжемся с вами в течение часа.');
        orderForm.reset();
        
        // Очищаем корзину после отправки
        cart = {};
        saveCart();
        updateAllCounters();
        updateCartUI();
        closeCart();
    });
}

// Отслеживание скролла для мини-корзины
window.addEventListener('scroll', updateMiniCartVisibility);
window.addEventListener('resize', updateMiniCartVisibility);

// Анимация появления элементов при скролле
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animated');
        }
    });
}, observerOptions);

document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    updateMiniCartVisibility();
});




// Дополнительные товары (8 штук, все одинаковые для простоты)
const extraProductsHTML = `
    <!-- Строка 1 -->
    <div class="product-card fade-in">
        <div class="product-image">
            <div class="placeholder-img">🎅</div>
        </div>
        <div class="product-content">
            <h3>Свеча «Снеговик»</h3>
            <p>Аромат ванили и холодного снега. Высота 10 см, горение до 25 часов.</p>
            <div class="product-price">38 BYN</div>
            <div class="quantity-selector" data-product="Свеча «Снеговик»" data-price="38">
                <button class="qty-btn minus">-</button>
                <span class="qty-count">0</span>
                <button class="qty-btn plus">+</button>
            </div>
        </div>
    </div>
    <div class="product-card fade-in">
        <div class="product-image">
            <div class="placeholder-img">❄️</div>
        </div>
        <div class="product-content">
            <h3>Свеча «Снежинка»</h3>
            <p>Нежный аромат жасмина и свежего снега. Диаметр 15 см.</p>
            <div class="product-price">48 BYN</div>
            <div class="quantity-selector" data-product="Свеча «Снежинка»" data-price="48">
                <button class="qty-btn minus">-</button>
                <span class="qty-count">0</span>
                <button class="qty-btn plus">+</button>
            </div>
        </div>
    </div>
    <div class="product-card fade-in">
        <div class="product-image">
            <div class="placeholder-img">🎁</div>
        </div>
        <div class="product-content">
            <h3>Свеча «Подарок»</h3>
            <p>Аромат корицы и мандарина. Форма праздничного подарка с лентой.</p>
            <div class="product-price">52 BYN</div>
            <div class="quantity-selector" data-product="Свеча «Подарок»" data-price="52">
                <button class="qty-btn minus">-</button>
                <span class="qty-count">0</span>
                <button class="qty-btn plus">+</button>
            </div>
        </div>
    </div>
    <div class="product-card fade-in">
        <div class="product-image">
            <div class="placeholder-img">🕯️</div>
        </div>
        <div class="product-content">
            <h3>Свеча «Классическая»</h3>
            <p>Тёплый аромат сандала и ванили. Простая элегантная форма.</p>
            <div class="product-price">35 BYN</div>
            <div class="quantity-selector" data-product="Свеча «Классическая»" data-price="35">
                <button class="qty-btn minus">-</button>
                <span class="qty-count">0</span>
                <button class="qty-btn plus">+</button>
            </div>
        </div>
    </div>
    
    <!-- Строка 2 -->
    <div class="product-card fade-in">
        <div class="product-image">
            <div class="placeholder-img">🦉</div>
        </div>
        <div class="product-content">
            <h3>Статуэтка «Сова»</h3>
            <p>Соевый воск с ароматом старого леса. Мудрая ночная птица.</p>
            <div class="product-price">72 BYN</div>
            <div class="quantity-selector" data-product="Статуэтка «Сова»" data-price="72">
                <button class="qty-btn minus">-</button>
                <span class="qty-count">0</span>
                <button class="qty-btn plus">+</button>
            </div>
        </div>
    </div>
    <div class="product-card fade-in">
        <div class="product-image">
            <div class="placeholder-img">🌲</div>
        </div>
        <div class="product-content">
            <h3>Свеча «Пихта»</h3>
            <p>Насыщенный аромат хвои и эвкалипта. Форма ветки пихты.</p>
            <div class="product-price">44 BYN</div>
            <div class="quantity-selector" data-product="Свеча «Пихта»" data-price="44">
                <button class="qty-btn minus">-</button>
                <span class="qty-count">0</span>
                <button class="qty-btn plus">+</button>
            </div>
        </div>
    </div>
    <div class="product-card fade-in">
        <div class="product-image">
            <div class="placeholder-img">🔥</div>
        </div>
        <div class="product-content">
            <h3>Свеча «Камин»</h3>
            <p>Аромат горящего дерева и кожи. Для создания уюта у огня.</p>
            <div class="product-price">58 BYN</div>
            <div class="quantity-selector" data-product="Свеча «Камин»" data-price="58">
                <button class="qty-btn minus">-</button>
                <span class="qty-count">0</span>
                <button class="qty-btn plus">+</button>
            </div>
        </div>
    </div>
    <div class="product-card fade-in">
        <div class="product-image">
            <div class="placeholder-img">🌙</div>
        </div>
        <div class="product-content">
            <h3>Свеча «Луна»</h3>
            <p>Таинственный аромат лаванды и ночных цветов. Форма полной луны.</p>
            <div class="product-price">49 BYN</div>
            <div class="quantity-selector" data-product="Свеча «Луна»" data-price="49">
                <button class="qty-btn minus">-</button>
                <span class="qty-count">0</span>
                <button class="qty-btn plus">+</button>
            </div>
        </div>
    </div>
`;

// Данные дополнительных товаров
const extraProductsData = [
    {
        id: 5,
        emoji: "🎅",
        name: "Свеча «Снеговик»",
        desc: "Аромат ванили и холодного снега. Высота 10 см, горение до 25 часов.",
        price: 38
    },
    {
        id: 6,
        emoji: "❄️",
        name: "Свеча «Снежинка»",
        desc: "Нежный аромат жасмина и свежего снега. Диаметр 15 см.",
        price: 48
    },
    {
        id: 7,
        emoji: "🎁",
        name: "Свеча «Подарок»",
        desc: "Аромат корицы и мандарина. Форма праздничного подарка с лентой.",
        price: 52
    },
    {
        id: 8,
        emoji: "🕯️",
        name: "Свеча «Классическая»",
        desc: "Тёплый аромат сандала и ванили. Простая элегантная форма.",
        price: 35
    },
    {
        id: 9,
        emoji: "🦉",
        name: "Статуэтка «Сова»",
        desc: "Соевый воск с ароматом старого леса. Мудрая ночная птица.",
        price: 72
    },
    {
        id: 10,
        emoji: "🌲",
        name: "Свеча «Пихта»",
        desc: "Насыщенный аромат хвои и эвкалипта. Форма ветки пихты.",
        price: 44
    },
    {
        id: 11,
        emoji: "🔥",
        name: "Свеча «Камин»",
        desc: "Аромат горящего дерева и кожи. Для создания уюта у огня.",
        price: 58
    },
    {
        id: 12,
        emoji: "🌙",
        name: "Свеча «Луна»",
        desc: "Таинственный аромат лаванды и ночных цветов. Форма полной луны.",
        price: 49
    }
];

// Состояние
let isExpanded = false;

// Функция создания HTML товара
function createProductHTML(product) {
    return `
        <div class="product-card fade-in">
            <div class="product-image">
                <div class="placeholder-img">${product.emoji}</div>
            </div>
            <div class="product-content">
                <h3>${product.name}</h3>
                <p>${product.desc}</p>
                <div class="product-price">${product.price} BYN</div>
                <div class="quantity-selector" data-product="${product.name}" data-price="${product.price}">
                    <button class="qty-btn minus">-</button>
                    <span class="qty-count">0</span>
                    <button class="qty-btn plus">+</button>
                </div>
            </div>
        </div>
    `;
}

// Функция загрузки/скрытия дополнительных товаров
function toggleCollection() {
    const extraContainer = document.getElementById('extraProducts');
    const toggleBtn = document.getElementById('toggleCollectionBtn');
    
    if (!extraContainer || !toggleBtn) return;
    
    if (!isExpanded) {
        // Показываем коллекцию
        if (extraContainer.children.length === 0) {
            // Загружаем товары в первый раз
            let productsHTML = '';
            extraProductsData.forEach(product => {
                productsHTML += createProductHTML(product);
            });
            extraContainer.innerHTML = productsHTML;
        }
        
        extraContainer.classList.add('visible');
        toggleBtn.textContent = 'Скрыть коллекцию';
        toggleBtn.classList.remove('btn-primary');
        toggleBtn.classList.add('btn-secondary');
        isExpanded = true;
        
        // Инициализируем счётчики для новых товаров
        setTimeout(() => {
            initQuantitySelectors();
        }, 100);
    } else {
        // Скрываем коллекцию
        extraContainer.classList.remove('visible');
        toggleBtn.textContent = 'Посмотреть всю коллекцию';
        toggleBtn.classList.remove('btn-secondary');
        toggleBtn.classList.add('btn-primary');
        isExpanded = false;
        
        // Прокручиваем к началу каталога
        setTimeout(() => {
            document.getElementById('catalog').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 300);
    }
}

// Инициализация счётчиков количества
function initQuantitySelectors() {
    document.querySelectorAll('.quantity-selector').forEach(selector => {
        // Проверяем, не инициализирован ли уже
        if (selector.dataset.initialized) return;
        
        const minusBtn = selector.querySelector('.minus');
        const plusBtn = selector.querySelector('.plus');
        const countSpan = selector.querySelector('.qty-count');
        
        minusBtn.addEventListener('click', () => {
            let count = parseInt(countSpan.textContent);
            if (count > 0) {
                countSpan.textContent = count - 1;
                updateCart();
            }
        });
        
        plusBtn.addEventListener('click', () => {
            let count = parseInt(countSpan.textContent);
            countSpan.textContent = count + 1;
            updateCart();
        });
        
        // Помечаем как инициализированный
        selector.dataset.initialized = 'true';
    });
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('toggleCollectionBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleCollection);
    }
    
    // Инициализируем счётчики для первых 4 товаров
    initQuantitySelectors();
});

// Просто добавляем класс после загрузки
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        document.body.classList.add('page-loaded');
        document.body.style.overflow = 'auto'; // Возвращаем скролл
    }, 1800); // Чуть больше чем анимация
});

// На всякий случай при полной загрузке
window.addEventListener('load', function() {
    document.body.classList.add('page-loaded');
    document.body.style.overflow = 'auto';
    // Принудительно скрываем псевдоэлемент
    const style = document.createElement('style');
    style.textContent = 'body::before { display: none !important; }';
    document.head.appendChild(style);
});