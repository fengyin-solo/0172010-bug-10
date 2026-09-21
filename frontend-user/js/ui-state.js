/* ========================================
   UI 状态管理：诊断侧栏展开/滚动锁定/位置记忆
   - 打开侧栏时锁定页面滚动（position:fixed 方案，兼容 iOS）
   - 跳转/关闭时按"先解锁恢复滚动位置，再定位目标"的顺序执行
   - 页面、矩阵列表、侧栏三处滚动位置各自保存与恢复
   - 展开状态持久化，刷新后与关闭前保持一致
   ======================================== */

(function () {
    'use strict';

    const STORAGE_KEY = 'diagnostic-dashboard-ui-state';
    const SIDEBAR_TRANSITION_MS = 400; // 与 CSS 中 transform 过渡时长保持一致

    class UiStateManager {
        constructor() {
            this.sidebar = null;
            this.toggle = null;
            this.close = null;
            this.sidebarBody = null;
            this.matrixWrapper = null;

            this.isOpen = false;
            this.lockedScrollY = 0;
            this.saveTimer = null;
            this.listenersBound = false;

            // 恢复期间挂起保存，避免恢复动作本身把已保存的位置覆盖掉
            this.restoring = true;
            this.restoredState = null;
        }

        init() {
            this.sidebar = document.getElementById('diagnosticSidebar');
            this.toggle = document.getElementById('sidebarToggle');
            this.close = document.getElementById('sidebarClose');
            this.sidebarBody = document.getElementById('sidebarBody');
            this.matrixWrapper = document.querySelector('.matrix-wrapper');

            if (!this.sidebar || !this.toggle || !this.close || !this.sidebarBody) return;

            // 由我们自己接管浏览器的滚动恢复，避免与持久化位置打架
            if ('scrollRestoration' in history) {
                history.scrollRestoration = 'manual';
            }

            this.bindEvents();

            // 1) 尽早恢复页面滚动位置（在图表/字体撑高页面前先定位）
            this.restoreState();

            // 2) 内容（ECharts、字体、图片）是异步撑开的，分阶段再校正几次
            const reapply = () => this.applyRestoredPositions();
            requestAnimationFrame(() => {
                requestAnimationFrame(reapply);
                setTimeout(reapply, 100);
                setTimeout(reapply, 400);
                setTimeout(reapply, 900);
            });
            window.addEventListener('load', () => {
                reapply();
                setTimeout(reapply, 200);
            });

            // 用户一旦开始操作就结束恢复窗口，后续滚动以用户行为为准
            const finishRestore = () => { this.restoring = false; };
            ['pointerdown', 'keydown', 'touchstart', 'wheel'].forEach(type => {
                window.addEventListener(type, finishRestore, { once: true, passive: true });
            });
            setTimeout(finishRestore, 1500);
        }

        bindEvents() {
            if (this.listenersBound) return;
            this.listenersBound = true;

            this.toggle.addEventListener('click', () => this.openSidebar());
            this.close.addEventListener('click', () => this.closeSidebar());

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) this.closeSidebar();
            });

            // 侧栏内部滚动位置记忆
            this.sidebarBody.addEventListener('scroll', () => this.scheduleSave(), { passive: true });

            // 矩阵横向列表滚动位置记忆
            if (this.matrixWrapper) {
                this.matrixWrapper.addEventListener('scroll', () => this.scheduleSave(), { passive: true });
            }

            // 页面滚动位置记忆 + 头部透明状态同步
            window.addEventListener('scroll', () => {
                if (!this.isOpen) this.scheduleSave();
                this.updateHeaderState();
            }, { passive: true });

            // 关闭/刷新前确保最新状态落盘
            window.addEventListener('pagehide', () => this.saveState());
            window.addEventListener('beforeunload', () => this.saveState());

            // 窄屏旋转/分屏变化时校正锁定状态与头部
            window.addEventListener('resize', () => this.updateHeaderState());
        }

        /* ---------- 展开/关闭 ---------- */

        openSidebar() {
            if (this.isOpen) return;
            this.isOpen = true;

            this.lockPageScroll();

            this.sidebar.classList.add('open');
            this.toggle.setAttribute('aria-expanded', 'true');
            this.toggle.classList.add('is-hidden');

            // 恢复侧栏内部上次的阅读位置
            if (this.restoredState && typeof this.restoredState.sidebarScrollTop === 'number') {
                this.sidebarBody.scrollTop = this.restoredState.sidebarScrollTop;
            }

            this.updateHeaderState();
            this.saveState();
        }

        closeSidebar() {
            if (!this.isOpen) return;
            this.isOpen = false;

            this.sidebar.classList.remove('open');
            this.toggle.setAttribute('aria-expanded', 'false');
            this.toggle.classList.remove('is-hidden');

            // 等侧栏滑出动画结束再解锁：动画期间背景保持 fixed，
            // 避免"背景先回到原位、侧栏还盖在上面"的错位感
            setTimeout(() => {
                if (!this.isOpen) this.unlockPageScroll();
            }, SIDEBAR_TRANSITION_MS);

            this.saveState();
        }

        /* ---------- 页面滚动锁定 ---------- */

        lockPageScroll() {
            // 关闭动画尚未结束时重新展开：页面仍处于锁定态，
            // 此时 window.scrollY 恒为 0，必须保留原来的锁定位置
            if (document.body.classList.contains('scroll-locked')) {
                this.updateHeaderState();
                return;
            }

            const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
            this.lockedScrollY = scrollY;

            document.body.style.top = `-${scrollY}px`;
            document.body.classList.add('scroll-locked');

            // fixed 定位后 header 的滚动透明度会失去依据，手动同步为当前状态
            this.updateHeaderState();
        }

        unlockPageScroll() {
            if (!document.body.classList.contains('scroll-locked')) {
                this.updateHeaderState();
                return;
            }

            document.body.classList.remove('scroll-locked');
            document.body.style.top = '';

            // 恢复锁定前的页面位置；fixed 解除后文档高度才恢复，此时 clamp 才可靠
            const y = this.clampScrollY(this.lockedScrollY);
            this.instantScrollTo(y);

            this.updateHeaderState();
        }

        clampScrollY(y) {
            const maxScroll = Math.max(
                0,
                document.documentElement.scrollHeight - window.innerHeight
            );
            return Math.max(0, Math.min(y, maxScroll));
        }

        // 程序化定位必须瞬时完成，不能被全局 scroll-behavior: smooth 拖成动画，
        // 否则解锁恢复会被观察成"停在半路"
        instantScrollTo(y) {
            try {
                window.scrollTo({ top: y, left: 0, behavior: 'instant' });
            } catch (e) {
                window.scrollTo(0, y);
            }
        }

        /* ---------- 侧栏断层卡片跳转 ---------- */

        jumpTo(selector) {
            const target = document.querySelector(selector);
            if (!target) {
                this.closeSidebar();
                return;
            }

            const wasOpen = this.isOpen;
            this.isOpen = false;
            this.sidebar.classList.remove('open');
            this.toggle.setAttribute('aria-expanded', 'false');
            this.toggle.classList.remove('is-hidden');

            const scrollToTarget = () => {
                // 优先尊重 CSS scroll-margin（留出视觉间距），不支持时回退手动计算
                const supportsScrollMargin = typeof window.CSS !== 'undefined' &&
                    typeof window.CSS.supports === 'function' &&
                    window.CSS.supports('scroll-margin-top', '1px');
                if (supportsScrollMargin) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    const margin = 16;
                    const top = target.getBoundingClientRect().top + window.scrollY - margin;
                    window.scrollTo({ top, behavior: 'smooth' });
                }

                target.style.transition = 'box-shadow 0.5s ease';
                target.style.boxShadow = '0 0 40px rgba(168, 85, 247, 0.5)';
                setTimeout(() => { target.style.boxShadow = ''; }, 2000);
            };

            if (wasOpen) {
                // 关键顺序：先解锁并把页面放回原滚动位置，再发起跳转，
                // 这样 smooth scroll 的起点正确，且不会在侧栏仍遮挡时定位
                document.body.classList.remove('scroll-locked');
                document.body.style.top = '';
                this.instantScrollTo(this.lockedScrollY);
                this.updateHeaderState();

                // 等侧栏滑出后再滚动，目标区块不会被遮挡
                setTimeout(scrollToTarget, SIDEBAR_TRANSITION_MS);
            } else {
                scrollToTarget();
            }

            this.saveState();
        }

        /* ---------- 头部透明状态 ---------- */

        updateHeaderState() {
            const header = document.querySelector('.header');
            if (!header) return;

            // 锁定期间 window.scrollY 恒为 0，需使用锁定前记录的位置
            const scrollY = this.isOpen
                ? this.lockedScrollY
                : (window.scrollY || document.documentElement.scrollTop || 0);

            // 回到顶部必须完全不透明，避免残留半透明
            const opacity = scrollY <= 0 ? 1 : Math.max(0.5, 1 - scrollY / 500);
            header.style.opacity = String(opacity);
        }

        /* ---------- 状态持久化 ---------- */

        readState() {
            try {
                return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
            } catch (e) {
                return {};
            }
        }

        scheduleSave() {
            // 恢复期间任何程序化滚动都不应覆盖保存的位置
            if (this.restoring) return;
            clearTimeout(this.saveTimer);
            this.saveTimer = setTimeout(() => this.saveState(), 200);
        }

        saveState() {
            if (this.restoring) return;
            clearTimeout(this.saveTimer);
            const state = {
                sidebarOpen: this.isOpen,
                pageScrollY: this.isOpen ? this.lockedScrollY : (window.scrollY || 0),
                matrixScrollLeft: this.matrixWrapper ? this.matrixWrapper.scrollLeft : 0,
                sidebarScrollTop: this.sidebarBody.scrollTop
            };
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            } catch (e) { /* 隐私模式等场景静默忽略 */ }
        }

        restoreState() {
            const state = this.readState();
            this.restoredState = state;
            this.restoring = true;

            if (state.sidebarOpen) {
                this.isOpen = true;
                // 此时 fixed 尚未施加，文档高度正常，记录原始值；
                // 不要在锁定后用 scrollHeight 做 clamp（那时高度恒等于视口）
                this.lockedScrollY = state.pageScrollY || 0;

                document.body.style.top = `-${this.lockedScrollY}px`;
                document.body.classList.add('scroll-locked');

                // 初次恢复不播放滑入动画，直接呈现关闭前的状态
                this.sidebar.classList.add('open', 'no-transition');
                this.toggle.setAttribute('aria-expanded', 'true');
                this.toggle.classList.add('is-hidden');

                if (this.matrixWrapper && typeof state.matrixScrollLeft === 'number') {
                    this.matrixWrapper.scrollLeft = state.matrixScrollLeft;
                }
                if (typeof state.sidebarScrollTop === 'number') {
                    this.sidebarBody.scrollTop = state.sidebarScrollTop;
                }

                // 两帧后移除无动画标记，之后的开关仍有过渡
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    this.sidebar.classList.remove('no-transition');
                }));
            } else {
                this.isOpen = false;
                if (typeof state.pageScrollY === 'number') {
                    this.instantScrollTo(state.pageScrollY);
                }
                if (this.matrixWrapper && typeof state.matrixScrollLeft === 'number') {
                    this.matrixWrapper.scrollLeft = state.matrixScrollLeft;
                }
            }

            this.updateHeaderState();
        }

        // 内容异步撑开后反复校正，直到布局稳定
        applyRestoredPositions() {
            const state = this.restoredState;
            if (!state) return;

            this.restoring = true;

            if (state.sidebarOpen) {
                // 保持锁定时记录的原始位置；仅在确认文档可滚动范围内时才微调 top
                const rawY = state.pageScrollY || 0;
                this.lockedScrollY = rawY;
                document.body.style.top = `-${rawY}px`;
                document.body.classList.add('scroll-locked');
                if (typeof state.sidebarScrollTop === 'number') {
                    this.sidebarBody.scrollTop = state.sidebarScrollTop;
                }
            } else {
                const y = this.clampScrollY(state.pageScrollY || 0);
                if (Math.abs(window.scrollY - y) > 1) {
                    this.instantScrollTo(y);
                }
            }

            if (this.matrixWrapper && typeof state.matrixScrollLeft === 'number') {
                this.matrixWrapper.scrollLeft = state.matrixScrollLeft;
            }

            this.updateHeaderState();
        }
    }

    window.uiState = new UiStateManager();
})();
