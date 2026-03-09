/**
 * ============================================================
 *  Pawi (派怡) 官方網站 — 核心互動邏輯
 *  版本：V2.0  (2026-03)
 *
 *  *** 此檔案需放置於 Pawi/js/main.js ***
 *
 *  功能模組：
 *    01. 漢堡選單（手機版側滑 + 遮罩）
 *    02. 產品分類過濾（含淡入動畫）
 *    03. 產品詳情頁籤切換（openTab）
 *    04. 檢驗報告 Lightbox 放大預覽
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', function () {

    /* =========================================================
       01. 漢堡選單
       ========================================================= */
    var menuToggle  = document.getElementById('menuToggle');
    var navMenu     = document.getElementById('navMenu');
    var menuOverlay = document.getElementById('menuOverlay');

    function toggleMenu() {
        if (!navMenu || !menuOverlay) return;

        var isActive = navMenu.classList.toggle('active');
        menuOverlay.classList.toggle('active');
        document.body.classList.toggle('menu-open', isActive);

        // 漢堡圖示切換 fa-bars ↔ fa-times
        var icon = menuToggle ? menuToggle.querySelector('i') : null;
        if (icon) {
            icon.classList.toggle('fa-bars',  !isActive);
            icon.classList.toggle('fa-times',  isActive);
        }
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', function (e) {
            e.preventDefault();
            toggleMenu();
        });
    }

    if (menuOverlay) {
        menuOverlay.addEventListener('click', toggleMenu);
    }

    document.querySelectorAll('.nav-menu a').forEach(function (link) {
        link.addEventListener('click', function () {
            if (navMenu && navMenu.classList.contains('active')) {
                toggleMenu();
            }
        });
    });


    /* =========================================================
       02. 分類篩選（產品頁 & 新聞列表頁共用）
       ========================================================= */
    var filterButtons = document.querySelectorAll('.filter-btn');

    if (filterButtons.length > 0) {
        // 判斷是產品卡片還是新聞卡片
        var filterCards = document.querySelectorAll('.product-card').length > 0
            ? document.querySelectorAll('.product-card')
            : document.querySelectorAll('.news-card');

        filterButtons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                filterButtons.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');

                var filterValue = btn.getAttribute('data-filter') || 'all';

                filterCards.forEach(function (card) {
                    card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
                    card.style.opacity    = '0';
                    card.style.transform  = 'scale(0.95)';
                });

                setTimeout(function () {
                    filterCards.forEach(function (card) {
                        var category  = card.getAttribute('data-category');
                        var isVisible = (filterValue === 'all' || category === filterValue);
                        card.style.display = isVisible ? '' : 'none';
                        if (isVisible) {
                            requestAnimationFrame(function () {
                                requestAnimationFrame(function () {
                                    card.style.opacity   = '1';
                                    card.style.transform = 'scale(1)';
                                });
                            });
                        }
                    });
                }, 260);
            });
        });
    }


    /* =========================================================
       04. 檢驗報告 Lightbox
       ========================================================= */
    var modal      = document.getElementById('pawiLightbox');
    var modalImg   = document.getElementById('imgFullView');
    var modalCapt  = document.getElementById('modalCaption');
    var closeBtn   = document.querySelector('.modal-close');
    var reportImgs = document.querySelectorAll('.report-preview-card img');

    if (modal && reportImgs.length > 0) {
        reportImgs.forEach(function (img) {
            img.addEventListener('click', function () {
                modalImg.src        = this.src;
                modalCapt.innerHTML = this.alt;
                modal.style.display = 'flex';
            });
        });
        if (closeBtn) {
            closeBtn.addEventListener('click', function () {
                modal.style.display = 'none';
            });
        }
        modal.addEventListener('click', function (e) {
            if (e.target === modal) modal.style.display = 'none';
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
        });
    }

}); // END DOMContentLoaded


/* ============================================================
   03. 產品詳情頁籤切換（全域，供 HTML onclick 呼叫）
   ============================================================ */
function openTab(evt, tabName) {
    document.querySelectorAll('.tab-content').forEach(function (c) {
        c.style.display = 'none';
        c.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(function (b) {
        b.classList.remove('active');
    });
    var target = document.getElementById(tabName);
    if (target) {
        target.style.display = 'block';
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                target.classList.add('active');
            });
        });
    }
    evt.currentTarget.classList.add('active');
}


/* ============================================================
   05. 購物車側欄
   - 點擊「加入購物車」→ 側欄滑出，商品加入清單
   - 支援數量增減、移除單項商品
   - 自動計算合計金額
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {

    var cartSidebar  = document.getElementById('cartSidebar');
    var cartOverlay  = document.getElementById('cartOverlay');
    var cartClose    = document.getElementById('cartClose');
    var cartItemList = document.getElementById('cartItemList');
    var cartEmpty    = document.getElementById('cartEmpty');
    var cartFooter   = document.getElementById('cartFooter');
    var cartTotal    = document.getElementById('cartTotalPrice');

    // 若本頁無購物車側欄（非產品頁），直接略過
    if (!cartSidebar) return;

    // 購物車資料（陣列）
    var cartItems = [];

    /* --- 開啟 / 關閉側欄 --- */
    function openCart() {
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
        document.body.classList.add('menu-open'); // 鎖定背景捲動
    }

    function closeCart() {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.classList.remove('menu-open');
    }

    if (cartClose)   cartClose.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

    /* --- 重新渲染購物車列表 --- */
    function renderCart() {
        cartItemList.innerHTML = '';

        if (cartItems.length === 0) {
            cartEmpty.style.display  = 'block';
            cartFooter.style.display = 'none';
            return;
        }

        cartEmpty.style.display  = 'none';
        cartFooter.style.display = 'block';

        var total = 0;

        cartItems.forEach(function (item, index) {
            total += item.price * item.qty;

            var li = document.createElement('li');
            li.className = 'cart-item';
            li.innerHTML =
                '<img class="cart-item-img" src="' + item.img + '" alt="' + item.name + '">' +
                '<div class="cart-item-info">' +
                    '<p class="cart-item-name">' + item.name + '</p>' +
                    '<p class="cart-item-price">NT$ ' + (item.price * item.qty).toLocaleString() + '</p>' +
                    '<div class="cart-item-qty">' +
                        '<button class="cart-qty-btn" data-action="minus" data-index="' + index + '">－</button>' +
                        '<span class="cart-qty-num">' + item.qty + '</span>' +
                        '<button class="cart-qty-btn" data-action="plus" data-index="' + index + '">＋</button>' +
                    '</div>' +
                '</div>' +
                '<button class="cart-item-remove" data-index="' + index + '" aria-label="移除">' +
                    '<i class="fas fa-trash-alt"></i>' +
                '</button>';

            cartItemList.appendChild(li);
        });

        cartTotal.textContent = 'NT$ ' + total.toLocaleString();
    }

    /* --- 數量增減 & 移除（事件委派） --- */
    cartItemList.addEventListener('click', function (e) {
        var qtyBtn    = e.target.closest('.cart-qty-btn');
        var removeBtn = e.target.closest('.cart-item-remove');

        if (qtyBtn) {
            var idx    = parseInt(qtyBtn.getAttribute('data-index'));
            var action = qtyBtn.getAttribute('data-action');
            if (action === 'plus') {
                cartItems[idx].qty += 1;
            } else if (action === 'minus') {
                cartItems[idx].qty -= 1;
                if (cartItems[idx].qty <= 0) cartItems.splice(idx, 1);
            }
            renderCart();
        }

        if (removeBtn) {
            var idx = parseInt(removeBtn.getAttribute('data-index'));
            cartItems.splice(idx, 1);
            renderCart();
        }
    });

    /* --- 加入購物車按鈕 --- */
    document.querySelectorAll('.btn-add-cart').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var id    = this.getAttribute('data-id');
            var name  = this.getAttribute('data-name');
            var price = parseInt(this.getAttribute('data-price'));
            var img   = this.getAttribute('data-img');

            // 取得數量輸入框的值
            var qtyInputId = this.getAttribute('data-qty-input');
            var qtyInput   = qtyInputId ? document.getElementById(qtyInputId) : null;
            var qty        = qtyInput ? Math.max(1, parseInt(qtyInput.value) || 1) : 1;

            // 若已存在同商品，累加數量
            var existing = cartItems.find(function (i) { return i.id === id; });
            if (existing) {
                existing.qty += qty;
            } else {
                cartItems.push({ id: id, name: name, price: price, img: img, qty: qty });
            }

            renderCart();
            openCart();

            // 按鈕短暫變綠色提示成功
            var self = this;
            self.classList.add('added');
            setTimeout(function () { self.classList.remove('added'); }, 1000);
        });
    });

}); // END 購物車 DOMContentLoaded
