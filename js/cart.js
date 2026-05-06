/* ============================================================
   js/cart.js  —  購物車資料管理層
   所有頁面皆載入（main.js 之前）
   window.CartManager 全域可用
   ============================================================ */

window.CartManager = (function () {

    var CART_KEY = 'molos_cart';

    function _load() {
        try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
        catch (e) { return []; }
    }

    function _save(items) {
        localStorage.setItem(CART_KEY, JSON.stringify(items));
    }

    function updateBadge() {
        var badge = document.getElementById('navCartBadge');
        if (!badge) return;
        var total = _load().reduce(function (sum, i) { return sum + i.qty; }, 0);
        badge.textContent = total;
    }

    function add(id, name, price, img, qty) {
        var items = _load();
        var found = false;
        for (var i = 0; i < items.length; i++) {
            if (items[i].id === id) { items[i].qty += qty; found = true; break; }
        }
        if (!found) items.push({ id: id, name: name, price: price, img: img, qty: qty });
        _save(items);
        updateBadge();
    }

    function remove(id) {
        _save(_load().filter(function (i) { return i.id !== id; }));
        updateBadge();
    }

    function update(id, qty) {
        var items = _load();
        for (var i = 0; i < items.length; i++) {
            if (items[i].id === id) {
                items[i].qty = qty;
                if (items[i].qty <= 0) items.splice(i, 1);
                break;
            }
        }
        _save(items);
        updateBadge();
    }

    function getAll()   { return _load(); }
    function clear()    { _save([]); updateBadge(); }
    function totalQty() { return _load().reduce(function (sum, i) { return sum + i.qty; }, 0); }

    /* navCartBtn：有側欄則開啟，否則導向 cart.html */
    document.addEventListener('DOMContentLoaded', function () {
        updateBadge();

        var navCartBtn = document.getElementById('navCartBtn');
        if (!navCartBtn) return;

        navCartBtn.addEventListener('click', function () {
            var path    = window.location.pathname;
            var sidebar = document.getElementById('cartSidebar');
            if (sidebar) {
                sidebar.classList.add('active');
                var overlay = document.getElementById('cartOverlay');
                if (overlay) overlay.classList.add('active');
                document.body.classList.add('menu-open');
            } else if (path.indexOf('cart.html') !== -1) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                var inSub = path.indexOf('/products/') !== -1 || path.indexOf('/news/') !== -1;
                window.location.href = inSub ? '../cart.html' : 'cart.html';
            }
        });
    });

    return { add: add, remove: remove, update: update, getAll: getAll, clear: clear, totalQty: totalQty, updateBadge: updateBadge };

})();
