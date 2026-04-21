/* ============================================================
   js/auth.js  —  Supabase 整合層
   載入順序：Supabase CDN  →  main.js  →  auth.js
   window.db  : Supabase client（全域可用）
   ============================================================ */

(function () {

    var SUPABASE_URL = 'https://rlmnjvcppucaehgxlmim.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsbW5qdmNwcHVjYWVoZ3hsbWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjAxNTgsImV4cCI6MjA4OTI5NjE1OH0.sPGXNrIdILGNmEbBf5v5IU1tBvZ1ySD0-0TLX-YYmIc';

    /* 建立 Supabase client */
    window.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    /* Supabase user → MolosAuth 格式 */
    function _toMolos(user) {
        var meta = user.user_metadata || {};
        return {
            id:     user.id,
            name:   meta.full_name || meta.name || user.email.split('@')[0],
            email:  user.email,
            avatar: meta.avatar_url || '',
            via:    (user.app_metadata || {}).provider || 'email'
        };
    }

    /* 監聽 auth 狀態變化 */
    window.db.auth.onAuthStateChange(function (event, session) {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (session && session.user) {
                MolosAuth.login(_toMolos(session.user));
                /* OAuth 回調後 navbar 仍顯示「登入」→ 重新載入讓 navbar 更新 */
                if (event === 'SIGNED_IN' && document.querySelector('.nav-login-btn')) {
                    window.location.reload();
                }
            }
        } else if (event === 'SIGNED_OUT') {
            localStorage.removeItem('molos_user');
        } else if (event === 'PASSWORD_RECOVERY') {
            /* 通知 login.html 顯示密碼重設表單 */
            document.dispatchEvent(new CustomEvent('molos:password-recovery'));
        }
    });

    /* 初始化：同步現有 session → MolosAuth */
    window.db.auth.getSession().then(function (res) {
        var session = res.data && res.data.session;
        if (session && session.user) {
            MolosAuth.login(_toMolos(session.user));
        } else if (!session && MolosAuth.isLoggedIn()) {
            /* session 已過期，清除本地快取 */
            localStorage.removeItem('molos_user');
        }
    });

})();
