document.addEventListener('DOMContentLoaded', function() {

    document.querySelectorAll('.filters-title').forEach(title => {
        title.addEventListener('click', () => {
            title.parentElement.classList.toggle('open');
        });
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilters();
        });
    });

    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilters();
        });
    });

    let timer;
    function debounce() {
        clearTimeout(timer);
        timer = setTimeout(applyFilters, 500);
    }

    document.getElementById('priceMin').addEventListener('input', debounce);
    document.getElementById('priceMax').addEventListener('input', debounce);
    document.getElementById('searchInput').addEventListener('input', debounce);

    document.getElementById('productGrid').addEventListener('click', e => {
        const btn = e.target.closest('button[data-id]');
        if (btn) addToCart(btn.dataset.id);
    });

    fetch('/cart/')
        .then(res => res.json())
        .then(data => {
            const count = data.items.reduce((sum, i) => sum + i.quantity, 0);
            document.getElementById('cartBadge').textContent = count;
        });

});

function applyFilters() {
    const category = document.querySelector('.filter-btn.active')?.dataset.category || '';
    const sort = document.querySelector('.sort-btn.active')?.dataset.sort || '';
    const priceMin = document.getElementById('priceMin').value;
    const priceMax = document.getElementById('priceMax').value;
    const search = document.getElementById('searchInput').value;

    fetch(`/api/products/?category=${category}&price_min=${priceMin}&price_max=${priceMax}&sort=${sort}&search=${search}`)
        .then(res => res.json())
        .then(data => renderProducts(data));
}

function renderProducts(data) {
    document.getElementById('productCount').textContent = data.count;
    const grid = document.getElementById('productGrid');
    grid.innerHTML = data.products.map(p => `
        <div class="product-card">
            <div class="card-img-wrap">
                <img src="${p.image}" alt="${p.name}">
                <span class="card-badge">${p.category}</span>
            </div>
            <h3>${p.name}</h3>
            <div class="product-card-footer">
                <p>${parseFloat(p.price).toLocaleString('ru')} ₽</p>
                <button data-id="${p.id}">🛒 Купить</button>
            </div>
        </div>
    `).join('');
}

function resetFilters() {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.filter-btn[data-category=""]').classList.add('active');
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.sort-btn[data-sort=""]').classList.add('active');
    document.getElementById('priceMin').value = '';
    document.getElementById('priceMax').value = '';
    document.getElementById('searchInput').value = '';
    applyFilters();
}

function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === name) return value;
    }
    return '';
}

function addToCart(productId) {
    fetch(`/cart/add/${productId}/`, {
        method: 'POST',
        headers: { 'X-CSRFToken': getCookie('csrftoken') }
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('cartBadge').textContent = data.count;
        openCart();
    });
}

function removeFromCart(productId) {
    fetch(`/cart/remove/${productId}/`, {
        method: 'POST',
        headers: { 'X-CSRFToken': getCookie('csrftoken') }
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('cartBadge').textContent = data.count;
        loadCart();
    });
}

function updateCart(productId, action) {
    fetch(`/cart/update/${productId}/?action=${action}`, {
        method: 'POST',
        headers: { 'X-CSRFToken': getCookie('csrftoken') }
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('cartBadge').textContent = data.count;
        loadCart();
    });
}

function loadCart() {
    fetch('/cart/')
        .then(res => res.json())
        .then(data => renderCart(data));
}

function renderCart(data) {
    const body = document.getElementById('cartBody');
    const total = document.getElementById('cartTotal');
    const badge = document.getElementById('cartHeaderBadge');

    const count = data.items.reduce((sum, i) => sum + i.quantity, 0);
    if (badge) badge.textContent = count;

    if (data.items.length === 0) {
        body.innerHTML = '<p class="cart-empty">Корзина пуста</p>';
        total.textContent = '0 ₽';
        return;
    }

    body.innerHTML = data.items.map(item => `
    <div class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-info">
            <p>${item.name}</p>
            <span>${parseFloat(item.price).toLocaleString('ru')} ₽ × ${item.quantity}</span>
            <div class="cart-item-qty">
                <button onclick="updateCart('${item.id}', 'minus')">−</button>
                <span>${item.quantity}</span>
                <button onclick="updateCart('${item.id}', 'plus')">+</button>
            </div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4h6v2"/>
            </svg>
        </button>
    </div>
    `).join('');

    total.textContent = data.total + ' ₽';
}

function openCart() {
    document.getElementById('cartModal').classList.add('open');
    document.getElementById('overlay').classList.add('active');
    loadCart();
}

