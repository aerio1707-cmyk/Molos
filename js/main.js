/**
 * ============================================================
 *  Molos 毛樂適 官方網站 — 核心互動邏輯
 *  版本：V3.0  (2026-03)
 *
 *  功能模組：
 *    01. 漢堡選單（手機版側滑 + 遮罩）
 *    02. 新聞 / 產品分類過濾（含淡入動畫）
 *    03. 產品詳情頁籤切換（openTab）
 *    04. 檢驗報告 Lightbox 放大預覽
 *    05. 購物車側欄（加入 / 數量增減 / 移除 / 合計）
 *    06. 導覽列購物車角標（全站同步）
 * ============================================================
 */

/* ============================================================
   共用工具：判斷目前頁面層級
   - 位於 /products/ 或 /news/ 子目錄時回傳 '../'
   - 否則回傳 ''
   ============================================================ */
function getBasePath() {
    var path = window.location.pathname;
    var inSub = path.indexOf('/products/') !== -1 ||
                path.indexOf('/news/')     !== -1;
    return inSub ? '../' : '';
}


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
        menuOverlay.addEventListener('click', function () {
            // 若購物車也是開著的，不要關選單（menuOverlay 同時被購物車使用）
            if (navMenu && navMenu.classList.contains('active')) {
                toggleMenu();
            }
        });
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
            closeBtn.addEventListener('click', function () { modal.style.display = 'none'; });
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


    /* =========================================================
       05 + 06. 購物車側欄 & 導覽列角標
       ========================================================= */
    var cartSidebar  = document.getElementById('cartSidebar');
    var cartOverlay  = document.getElementById('cartOverlay');
    var cartClose    = document.getElementById('cartClose');
    var cartItemList = document.getElementById('cartItemList');
    var cartEmpty    = document.getElementById('cartEmpty');
    var cartFooter   = document.getElementById('cartFooter');
    var cartTotal    = document.getElementById('cartTotalPrice');

    // 購物車側欄本頁無（非產品頁）時仍需更新角標，不直接 return
    var hasCartSidebar = !!cartSidebar;

    // 購物車資料（Session 等級：頁面重整後清空）
    var cartItems = [];

    /* ── 導覽列購物車角標 ── */
    var navCartBtn   = document.getElementById('navCartBtn');
    var navCartBadge = document.getElementById('navCartBadge');

    function updateBadge(animate) {
        if (!navCartBadge) return;

        var total = cartItems.reduce(function (sum, i) { return sum + i.qty; }, 0);

        if (total > 0) {
            navCartBadge.textContent = total > 99 ? '99+' : total;
            navCartBadge.classList.add('visible');
            if (animate) {
                navCartBadge.classList.remove('pop');
                // Force reflow
                void navCartBadge.offsetWidth;
                navCartBadge.classList.add('pop');
            }
        } else {
            navCartBadge.classList.remove('visible', 'pop');
        }
    }

    /* ── 導覽列購物車按鈕點擊 ── */
    if (navCartBtn) {
        navCartBtn.addEventListener('click', function () {
            if (hasCartSidebar) {
                openCart();
            } else {
                // 非產品頁（無側欄）→ 導向第一個產品頁
                window.location.href = getBasePath() + 'products/detail.html';
            }
        });
    }

    if (!hasCartSidebar) {
        updateBadge(false);
        return;
    }

    /* ── 開啟 / 關閉側欄 ── */
    function openCart() {
        cartSidebar.classList.add('active');
        if (cartOverlay) cartOverlay.classList.add('active');
        document.body.classList.add('menu-open');
    }

    function closeCart() {
        cartSidebar.classList.remove('active');
        if (cartOverlay) cartOverlay.classList.remove('active');
        document.body.classList.remove('menu-open');
    }

    if (cartClose)   cartClose.addEventListener('click', closeCart);

    // cartOverlay 被選單 & 購物車共用，需分辨當前是哪個開著
    if (cartOverlay) {
        cartOverlay.addEventListener('click', function () {
            if (cartSidebar && cartSidebar.classList.contains('active')) {
                closeCart();
            }
        });
    }

    /* ── 前往結帳 ── */
    var checkoutBtn = document.querySelector('.cart-checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function () {
            window.location.href = getBasePath() + 'checkout-maintenance.html';
        });
    }

    /* ── 渲染購物車列表 ── */
    function renderCart() {
        if (!cartItemList) return;
        cartItemList.innerHTML = '';

        if (cartItems.length === 0) {
            if (cartEmpty)  cartEmpty.style.display  = 'block';
            if (cartFooter) cartFooter.style.display = 'none';
            updateBadge(false);
            return;
        }

        if (cartEmpty)  cartEmpty.style.display  = 'none';
        if (cartFooter) cartFooter.style.display = 'block';

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

        if (cartTotal) cartTotal.textContent = 'NT$ ' + total.toLocaleString();
        updateBadge(false);
    }

    /* ── 數量增減 & 移除（事件委派） ── */
    if (cartItemList) {
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
                var ridx = parseInt(removeBtn.getAttribute('data-index'));
                cartItems.splice(ridx, 1);
                renderCart();
            }
        });
    }

    /* ── 加入購物車按鈕 ── */
    document.querySelectorAll('.btn-add-cart').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var id    = this.getAttribute('data-id');
            var name  = this.getAttribute('data-name');
            var price = parseInt(this.getAttribute('data-price'));
            var img   = this.getAttribute('data-img');

            var qtyInputId = this.getAttribute('data-qty-input');
            var qtyInput   = qtyInputId ? document.getElementById(qtyInputId) : null;
            var qty        = qtyInput ? Math.max(1, parseInt(qtyInput.value) || 1) : 1;

            var existing = cartItems.find(function (i) { return i.id === id; });
            if (existing) {
                existing.qty += qty;
            } else {
                cartItems.push({ id: id, name: name, price: price, img: img, qty: qty });
            }

            renderCart();
            openCart();
            updateBadge(true);  // 帶動畫

            var self = this;
            self.classList.add('added');
            setTimeout(function () { self.classList.remove('added'); }, 1000);
        });
    });

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
