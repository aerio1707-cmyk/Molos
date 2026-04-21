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
                // 手機版：點子選單連結時才關閉，點父項時展開子選單
                var parentLi = link.closest('.nav-dropdown-parent');
                if (!parentLi) toggleMenu();
            }
        });
    });

    /* ── 手機版：毛樂適系列 點擊展開子選單 ── */
    document.querySelectorAll('.nav-dropdown-parent').forEach(function(parent) {
        var parentLink = parent.querySelector('.nav-has-dropdown');
        if (!parentLink) return;
        parentLink.addEventListener('click', function(e) {
            // 桌機版不攔截（直接跳轉）
            if (window.innerWidth > 768) return;
            e.preventDefault();
            parent.classList.toggle('open');
            // 箭頭旋轉由 CSS .open class 控制，不用 inline style
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

    /* --- 前往結帳：導向維護頁 --- */
    var checkoutBtn = document.querySelector('.cart-checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function () {
            // 判斷目前頁面層級（products/ 子資料夾需往上一層）
            var path = window.location.pathname;
            var inSubfolder = path.indexOf('/products/') !== -1 ||
                              path.indexOf('/news/')     !== -1;
            var target = inSubfolder
                ? '../checkout-maintenance.html'
                : 'checkout-maintenance.html';
            window.location.href = target;
        });
    }

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


/* ============================================================
   06. 聯絡表單（EmailJS）
   - 即時欄位驗證（blur + submit）
   - 字數計數器
   - 送出中 Loading 狀態
   - 成功：切換成功畫面 + 打勾動畫
   - 失敗：顯示錯誤提示列
   ============================================================ */
(function () {

    var EMAILJS_SERVICE_ID  = 'service_khh7778';
    var EMAILJS_TEMPLATE_ID = 'template_2y1q98l';
    var EMAILJS_PUBLIC_KEY  = 'xnd9kva9gcXOc_7kB';

    var form        = document.getElementById('contact-form');
    var successBox  = document.getElementById('contact-success');
    var btnSubmit   = document.getElementById('btn-submit');
    var btnAgain    = document.getElementById('btn-again');
    var sendError   = document.getElementById('send-error');
    var msgArea     = document.getElementById('cf-message');
    var charCount   = document.getElementById('char-count');
    var hintMsg     = document.getElementById('hint-message');

    if (!form) return; // 非 about 頁面直接略過

    /* ── 初始化 EmailJS ── */
    emailjs.init(EMAILJS_PUBLIC_KEY);

    /* ── 字數計數器 ── */
    if (msgArea && charCount) {
        msgArea.addEventListener('input', function () {
            var len = this.value.length;
            charCount.textContent = len;
            hintMsg.classList.add('hint');
            hintMsg.style.display = 'flex';
            // 接近上限時變色提示
            charCount.style.color = len >= 900 ? '#e67e22' : '';
        });
    }

    /* ── 驗證單一欄位 ── */
    function validateField(fieldId, errId, checkFn) {
        var field  = document.getElementById(fieldId);
        var errEl  = document.getElementById(errId);
        if (!field || !errEl) return true;

        var ok = checkFn(field.value.trim());
        field.classList.toggle('is-error', !ok);
        field.classList.toggle('is-valid',  ok);
        errEl.classList.toggle('error', !ok);
        if (ok) errEl.style.display = 'none';
        return ok;
    }

    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function validateAll() {
        var v1 = validateField('cf-name',    'err-name',    function (v) { return v.length >= 2; });
        var v2 = validateField('cf-email',   'err-email',   function (v) { return EMAIL_RE.test(v); });
        var v3 = validateField('cf-subject', 'err-subject', function (v) { return v !== ''; });
        var v4 = validateField('cf-message', 'err-message', function (v) { return v.length >= 10; });
        return v1 && v2 && v3 && v4;
    }

    /* ── 即時驗證（離開欄位時） ── */
    ['cf-name','cf-email','cf-subject','cf-message'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('blur', function () {
            var errMap = {
                'cf-name'   : ['err-name',    function (v) { return v.length >= 2; }],
                'cf-email'  : ['err-email',   function (v) { return EMAIL_RE.test(v); }],
                'cf-subject': ['err-subject', function (v) { return v !== ''; }],
                'cf-message': ['err-message', function (v) { return v.length >= 10; }]
            };
            var rule = errMap[id];
            if (rule) validateField(id, rule[0], rule[1]);
        });
    });

    /* ── 送出表單 ── */
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validateAll()) {
            // 捲到第一個錯誤欄位
            var firstErr = form.querySelector('.is-error');
            if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        /* Loading 狀態 */
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner"></span>傳送中…';
        sendError.style.display = 'none';

        var params = {
            from_name : document.getElementById('cf-name').value.trim(),
            reply_to  : document.getElementById('cf-email').value.trim(),
            subject   : document.getElementById('cf-subject').value,
            message   : document.getElementById('cf-message').value.trim()
        };

        console.log('[EmailJS] 開始送出，參數：', params);

        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params)
            .then(function (res) {
                /* 成功：切換畫面 */
                console.log('[EmailJS] 送出成功：', res.status, res.text);
                form.style.display       = 'none';
                successBox.style.display = 'block';
                successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            })
            .catch(function (err) {
                /* 失敗：顯示詳細錯誤，恢復按鈕 */
                console.error('[EmailJS] 送出失敗：', err);
                var errDetail = '';
                if (err && err.status) {
                    errDetail = '（錯誤碼：' + err.status + '）';
                    if (err.status === 400) errDetail += ' — Template 變數不符';
                    if (err.status === 401) errDetail += ' — Public Key 錯誤';
                    if (err.status === 403) errDetail += ' — 網域未授權';
                    if (err.status === 404) errDetail += ' — Service ID 或 Template ID 錯誤';
                    if (err.status === 422) errDetail += ' — To Email 未設定';
                }
                sendError.style.display  = 'block';
                sendError.innerHTML = '<i class="fas fa-exclamation-triangle" style="margin-right:6px;"></i>'
                    + '訊息傳送失敗 ' + errDetail + '<br>'
                    + '<small style="color:#999;">請直接寄信至 service@molos.com.tw 或查看 F12 Console</small>';
                btnSubmit.disabled  = false;
                btnSubmit.innerHTML = '<i class="fas fa-paper-plane" style="margin-right:8px;"></i>重新送出';
            });
    });

    /* ── 再次留言：重置表單 ── */
    if (btnAgain) {
        btnAgain.addEventListener('click', function () {
            form.reset();
            charCount && (charCount.textContent = '0');
            // 清除所有驗證樣式
            form.querySelectorAll('.form-control').forEach(function (el) {
                el.classList.remove('is-error', 'is-valid');
            });
            form.querySelectorAll('.field-msg').forEach(function (el) {
                el.classList.remove('error');
                el.style.display = 'none';
            });
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<i class="fas fa-paper-plane" style="margin-right:8px;"></i>送出訊息';
            successBox.style.display = 'none';
            form.style.display       = 'block';
            // 捲回表單頂端
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

})();


/* ============================================================
   07. 會員系統 — 全站登入狀態管理 (MolosAuth)
   - 以 localStorage 保存登入狀態（跨分頁/重啟持久）
   - Navbar 動態切換：未登入顯示「登入」按鈕，
     已登入顯示頭像 + 暱稱 + 下拉選單
   ============================================================ */

/* ── Auth 核心模組（全域可呼叫）── */
var MolosAuth = (function () {
    var USER_KEY  = 'molos_user';
    var SB_PREFIX = 'sb-rlmnjvcppucaehgxlmim-';

    function _clearSbTokens() {
        var keys = [];
        for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (k && k.indexOf(SB_PREFIX) === 0) keys.push(k);
        }
        keys.forEach(function (k) { localStorage.removeItem(k); });
        if (window.db) window.db.auth.signOut();
    }

    return {
        login: function (userObj) {
            localStorage.setItem(USER_KEY, JSON.stringify(userObj));
        },
        logout: function () {
            localStorage.removeItem(USER_KEY);
            _clearSbTokens();
        },
        getUser: function () {
            try { return JSON.parse(localStorage.getItem(USER_KEY)); }
            catch (e) { return null; }
        },
        isLoggedIn: function () {
            return !!this.getUser();
        }
    };
})();


/* ── Navbar 會員入口渲染 ── */
document.addEventListener('DOMContentLoaded', function () {

    var navRight = document.querySelector('.nav-right');
    if (!navRight) return;

    /* 判斷路徑前綴（products/ news/ 子目錄需往上一層）*/
    var path = window.location.pathname;
    var base = (path.indexOf('/products/') !== -1 || path.indexOf('/news/') !== -1)
        ? '../' : '';

    var user = MolosAuth.getUser();

    if (!user) {
        /* ── 未登入：顯示「登入」按鈕 ── */
        var loginBtn = document.createElement('a');
        loginBtn.href      = base + 'login.html';
        loginBtn.className = 'nav-login-btn';
        loginBtn.innerHTML = '<i class="fas fa-user"></i><span>登入</span>';
        navRight.insertBefore(loginBtn, navRight.querySelector('.nav-cart-btn'));

    } else {
        /* ── 已登入：顯示頭像 + 暱稱 + 下拉選單 ── */
        var initial = (user.name || 'U').charAt(0).toUpperCase();

        var memberBtn = document.createElement('div');
        memberBtn.className = 'nav-member';
        memberBtn.innerHTML =
            '<button class="nav-member-btn" id="navMemberBtn" aria-expanded="false">' +
                (user.avatar
                    ? '<img src="' + user.avatar + '" alt="頭像" class="nav-avatar-img">'
                    : '<span class="nav-avatar-initial">' + initial + '</span>'
                ) +
                '<span class="nav-member-name">' + (user.name || '會員') + '</span>' +
                '<i class="fas fa-chevron-down nav-member-caret"></i>' +
            '</button>' +
            '<div class="nav-dropdown" id="navDropdown">' +
                '<a href="' + base + 'member.html" class="nav-dd-item">' +
                    '<i class="fas fa-user-edit"></i> 個人資料</a>' +
                '<a href="' + base + 'member.html#orders" class="nav-dd-item">' +
                    '<i class="fas fa-box"></i> 訂單查詢</a>' +
                '<div class="nav-dd-divider"></div>' +
                '<button class="nav-dd-item nav-dd-logout" id="navLogout">' +
                    '<i class="fas fa-sign-out-alt"></i> 登出</button>' +
            '</div>';

        navRight.insertBefore(memberBtn, navRight.querySelector('.nav-cart-btn'));

        /* 下拉開關 */
        var memberBtnEl = document.getElementById('navMemberBtn');
        var dropdown    = document.getElementById('navDropdown');

        memberBtnEl.addEventListener('click', function (e) {
            e.stopPropagation();
            var isOpen = dropdown.classList.toggle('open');
            memberBtnEl.setAttribute('aria-expanded', isOpen);
        });

        /* 點外面關閉 */
        document.addEventListener('click', function () {
            dropdown.classList.remove('open');
            memberBtnEl.setAttribute('aria-expanded', false);
        });

        /* 登出 */
        document.getElementById('navLogout').addEventListener('click', function () {
            MolosAuth.logout();
            window.location.href = base + 'index.html';
        });
    }
});
