/* ========================================
   UI 组件渲染
   ======================================== */

class ComponentRenderer {
    constructor() {
        this.typewriterText = '基于2026年"拉新"战略核心，诊断当前会员体系成熟度，识别关键断层，规划升级路径...';
        this.charIndex = 0;
    }

    // 打字机效果
    startTypewriter() {
        const el = document.getElementById('typewriter');
        if (!el) return;

        const type = () => {
            if (this.charIndex < this.typewriterText.length) {
                el.textContent = this.typewriterText.substring(0, this.charIndex + 1);
                this.charIndex++;
                setTimeout(type, 45);
            }
        };
        type();
    }

    // 渲染统计卡片
    renderStats() {
        const container = document.getElementById('statsGrid');
        if (!container) return;

        container.innerHTML = statsData.map((stat, index) => `
            <div class="glass-card stat-card fade-in delay-${index + 1}" data-index="${index}">
                <span class="stat-icon">${stat.icon}</span>
                <div class="stat-value">${stat.value}</div>
                <div class="stat-label">${stat.label}</div>
                ${stat.trend ? `<div class="stat-trend">${stat.trend}</div>` : ''}
            </div>
        `).join('');

        // 添加点击事件
        container.querySelectorAll('.stat-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = card.dataset.index;
                const stat = statsData[index];
                window.toast.info(stat.label, `当前值: ${stat.value}`);
            });
        });
    }

    // 渲染矩阵表格
    renderMatrix() {
        const table = document.getElementById('matrixTable');
        if (!table) return;

        let html = '<thead><tr><th>运营维度</th>';
        
        matrixData.phases.forEach(p => {
            html += `
                <th>
                    <div style="font-weight: 700;">${p.name}</div>
                    <div style="font-size: 12px; color: var(--neon-cyan); margin-top: 6px; opacity: 0.9;">
                        焦点: ${p.subtitle}
                    </div>
                </th>
            `;
        });
        html += '</tr></thead><tbody>';

        matrixData.dimensions.forEach((dim, dimIndex) => {
            html += `<tr class="fade-in delay-${Math.min(dimIndex + 1, 5)}">`;
            html += `
                <td class="dimension-cell">
                    <span class="dimension-icon">${dim.icon}</span>
                    ${dim.name}
                </td>
            `;

            matrixData.phases.forEach(phase => {
                const cell = matrixData.cells[dim.key][phase.key];
                let cellClass = '';
                let tag = '';

                if (cell.current) {
                    cellClass = 'cell-current';
                    tag = '<span class="status-tag tag-current">📍 当前位置</span>';
                }
                if (cell.target) {
                    cellClass = 'cell-target';
                    tag = '<span class="status-tag tag-target">🎯 改进目标</span>';
                }

                html += `<td class="${cellClass}"><div class="cell-content">${tag}<div class="sop-list">`;
                cell.sop.forEach(s => {
                    html += `<div class="sop-item">${s}</div>`;
                });
                html += '</div>';

                if (cell.tools && (cell.tools.international.length || cell.tools.domestic.length)) {
                    html += '<div class="tools-section"><div class="tools-label">🔧 推荐工具</div>';
                    cell.tools.international.forEach(t => {
                        html += `<span class="tool-tag international" data-tool="${t}">${t}</span>`;
                    });
                    cell.tools.domestic.forEach(t => {
                        html += `<span class="tool-tag domestic" data-tool="${t}">${t}</span>`;
                    });
                    html += '</div>';
                }
                html += '</div></td>';
            });
            html += '</tr>';
        });

        html += '</tbody>';
        table.innerHTML = html;

        // 添加工具标签点击事件
        table.querySelectorAll('.tool-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const toolName = tag.dataset.tool;
                const isInternational = tag.classList.contains('international');
                window.toast.info(
                    '工具推荐',
                    `${toolName} - ${isInternational ? '国际工具' : '国内工具'}`,
                    3000
                );
            });
        });
    }

    // 渲染速赢行动清单
    renderQuickWins() {
        const grid = document.getElementById('quickwinsGrid');
        if (!grid) return;

        grid.innerHTML = quickWins.map((qw, i) => `
            <div class="glass-card quickwin-card fade-in delay-${i + 1}" data-index="${i}">
                <div class="quickwin-number">${i + 1}</div>
                <div class="quickwin-header">
                    <div class="quickwin-icon">${qw.icon}</div>
                    <div>
                        <div class="quickwin-title">${qw.title}</div>
                        <div class="quickwin-timeline">⏱️ ${qw.timeline}</div>
                    </div>
                </div>
                <div class="quickwin-desc">${qw.desc}</div>
                <div class="quickwin-kpi">
                    ${qw.kpis.map(k => `
                        <div class="kpi-item">
                            <div class="kpi-value">${k.value}</div>
                            <div class="kpi-label">${k.label}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        // 添加点击事件
        grid.querySelectorAll('.quickwin-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = card.dataset.index;
                const qw = quickWins[index];
                window.toast.success(
                    qw.title,
                    `执行周期: ${qw.timeline}`,
                    4000
                );
            });
        });
    }

    // 创建粒子效果
    createParticles() {
        const container = document.querySelector('.particles');
        if (!container) return;

        const colors = ['#a855f7', '#ec4899', '#06b6d4', '#10b981'];
        
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 15}s`;
            particle.style.animationDuration = `${15 + Math.random() * 10}s`;
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particle.style.width = `${2 + Math.random() * 4}px`;
            particle.style.height = particle.style.width;
            container.appendChild(particle);
        }
    }

    initSidebar() {
        const sidebar = document.getElementById('diagnosticSidebar');
        const toggle = document.getElementById('sidebarToggle');
        const close = document.getElementById('sidebarClose');
        const body = document.getElementById('sidebarBody');
        const matrixWrapper = document.querySelector('.matrix-wrapper');
        if (!sidebar || !toggle || !close || !body) return;

        this.renderSidebarContent(body);

        // 侧栏展开状态与三处滚动位置（页面 / 矩阵列表 / 侧栏自身）统一持久化，
        // 保证刷新后与关闭前一致
        const STORAGE_KEY = 'diagnosticSidebarState';
        const CLOSE_DURATION = 400; // 与 CSS 中侧栏 transform 过渡时长保持一致
        const root = document.documentElement;

        const loadState = () => {
            try {
                return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
            } catch (e) {
                return {};
            }
        };
        const saveState = (patch) => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...loadState(), ...patch }));
            } catch (e) {
                // 隐私模式等场景下静默降级
            }
        };
        const debouncedSave = (() => {
            const timers = {};
            return (patch, key = 'default', delay = 100) => {
                clearTimeout(timers[key]);
                timers[key] = setTimeout(() => saveState(patch), delay);
            };
        })();

        // 临时关闭平滑滚动，用于状态恢复时的精确定位
        const instantScrollTo = (y) => {
            const previous = root.style.scrollBehavior;
            root.style.scrollBehavior = 'auto';
            window.scrollTo(0, y);
            root.style.scrollBehavior = previous;
        };

        // 背景滚动锁定：锁定前后记录/恢复页面滚动位置，并用等宽内边距补偿消失的滚动条
        const lockBackground = () => {
            const scrollbarGap = window.innerWidth - root.clientWidth;
            root.style.setProperty('--scrollbar-gap', `${scrollbarGap}px`);
            root.classList.add('sidebar-lock');
        };
        const unlockBackground = () => {
            root.classList.remove('sidebar-lock');
            root.style.removeProperty('--scrollbar-gap');
        };
        const syncHeader = () => {
            if (window.app && typeof window.app.updateHeader === 'function') {
                window.app.updateHeader();
            }
        };

        const openSidebar = () => {
            if (sidebar.classList.contains('open')) return;
            const state = loadState();
            saveState({ open: true, pageScrollY: window.scrollY });
            lockBackground();
            sidebar.classList.add('open');
            toggle.classList.add('is-hidden');
            // 恢复侧栏自身上次的滚动位置
            requestAnimationFrame(() => {
                body.scrollTop = state.sidebarScrollTop || 0;
            });
        };

        const closeSidebar = () => {
            if (!sidebar.classList.contains('open')) return;
            const returnY = loadState().pageScrollY ?? window.scrollY;
            sidebar.classList.remove('open');
            toggle.classList.remove('is-hidden');
            saveState({ open: false });
            // 等侧栏滑出动画结束后再解锁并把页面恢复到打开前的位置
            window.setTimeout(() => {
                if (sidebar.classList.contains('open')) return;
                unlockBackground();
                instantScrollTo(returnY);
                syncHeader();
            }, CLOSE_DURATION);
        };

        // 断层卡片 -> 页面区块映射，使用数据 id 而不是节点下标
        const jumpTargets = {
            1: '.charts-section',
            2: '.matrix-section',
            3: '.quickwins-section'
        };

        const jumpToTarget = (card) => {
            const selector = jumpTargets[card.dataset.gapId] || jumpTargets[1];
            const target = document.querySelector(selector);
            sidebar.classList.remove('open');
            toggle.classList.remove('is-hidden');
            saveState({ open: false });
            window.setTimeout(() => {
                if (sidebar.classList.contains('open')) return;
                // 侧栏完全滑出后再解锁、再定位，目标区块不会被侧栏遮挡
                unlockBackground();
                if (!target) return;
                if (selector === '.matrix-section' && matrixWrapper) {
                    matrixWrapper.scrollLeft = 0; // “📍 当前位置”在最左列
                }
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                this.flashSection(target);
                // 平滑滚动结束后的最终位置由 window scroll 监听自动持久化
                syncHeader();
            }, CLOSE_DURATION);
        };

        toggle.addEventListener('click', openSidebar);
        close.addEventListener('click', closeSidebar);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeSidebar();
        });

        body.querySelectorAll('.sidebar-gap-card').forEach((card) => {
            card.addEventListener('click', () => jumpToTarget(card));
        });

        // 侧栏自身滚动位置
        body.addEventListener('scroll', () => {
            debouncedSave({ sidebarScrollTop: body.scrollTop }, 'sidebar', 120);
        }, { passive: true });

        // 页面滚动位置（仅在未锁定时记录，锁定期间背景不应产生位移）
        window.addEventListener('scroll', () => {
            if (!root.classList.contains('sidebar-lock')) {
                debouncedSave({ pageScrollY: window.scrollY }, 'page', 80);
            }
        }, { passive: true });

        // 矩阵表格横向列表的滚动位置
        if (matrixWrapper) {
            matrixWrapper.addEventListener('scroll', () => {
                debouncedSave({ matrixScrollLeft: matrixWrapper.scrollLeft }, 'matrix', 120);
            }, { passive: true });
        }

        // 恢复刷新前的展开状态与三处滚动位置
        const state = loadState();
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        if (matrixWrapper) {
            matrixWrapper.scrollLeft = state.matrixScrollLeft || 0;
        }
        instantScrollTo(state.pageScrollY || 0);
        if (state.open) {
            // 先恢复页面位置再锁定，避免 overflow:hidden 时无法定位
            lockBackground();
            sidebar.classList.add('open');
            toggle.classList.add('is-hidden');
            requestAnimationFrame(() => {
                body.scrollTop = state.sidebarScrollTop || 0;
            });
        }
        syncHeader();
    }

    // 跳转目标区块高亮
    flashSection(section) {
        section.querySelectorAll('.glass-card').forEach((card) => {
            card.classList.remove('jump-highlight');
            void card.offsetWidth; // 重置动画
            card.classList.add('jump-highlight');
            setTimeout(() => card.classList.remove('jump-highlight'), 2000);
        });
    }

    renderSidebarContent(container) {
        const d = diagnosticSummary;
        let html = '';

        html += '<div class="sidebar-section">';
        html += '<div class="sidebar-section-title">📍 当前位置</div>';
        html += `
            <div class="sidebar-position-card is-current">
                <div class="sidebar-position-header">
                    <div class="sidebar-position-label" style="color: ${d.currentPosition.color}">${d.currentPosition.label}</div>
                    <div class="sidebar-position-subtitle">${d.currentPosition.subtitle}</div>
                </div>
                <div class="sidebar-score-bar">
                    <div class="sidebar-score-fill is-red" style="width: ${d.currentPosition.score}%"></div>
                </div>
                <div class="sidebar-position-desc">${d.currentPosition.description}</div>
            </div>
        `;
        html += '</div>';

        html += '<div class="sidebar-section">';
        html += '<div class="sidebar-section-title">🎯 改进目标</div>';
        html += `
            <div class="sidebar-position-card is-target">
                <div class="sidebar-position-header">
                    <div class="sidebar-position-label" style="color: ${d.targetPosition.color}">${d.targetPosition.label}</div>
                    <div class="sidebar-position-subtitle">${d.targetPosition.subtitle}</div>
                </div>
                <div class="sidebar-score-bar">
                    <div class="sidebar-score-fill is-green" style="width: ${d.targetPosition.score}%"></div>
                </div>
                <div class="sidebar-gap-badge">⚠️ ${d.targetPosition.gap}</div>
            </div>
        `;
        html += '</div>';

        html += '<div class="sidebar-section">';
        html += '<div class="sidebar-section-title">🔴 关键断层</div>';
        d.keyGaps.forEach(gap => {
            const sevClass = gap.severity === 'critical' ? 'is-critical' : 'is-high';
            html += `
                <div class="sidebar-gap-card ${sevClass}" data-gap-id="${gap.id}">
                    <div class="sidebar-gap-header">
                        <span class="sidebar-gap-icon">${gap.icon}</span>
                        <span class="sidebar-gap-title">${gap.title}</span>
                        <span class="sidebar-gap-severity ${sevClass}">${gap.severity === 'critical' ? '严重' : '高'}</span>
                    </div>
                    <div class="sidebar-gap-metric">
                        <span class="sidebar-gap-metric-value">${gap.metric}</span>
                        <span class="sidebar-gap-metric-label">${gap.metricLabel}</span>
                    </div>
                    <div class="sidebar-gap-desc">${gap.description}</div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;

        requestAnimationFrame(() => {
            container.querySelectorAll('.sidebar-score-fill').forEach(el => {
                const w = el.style.width;
                el.style.width = '0%';
                requestAnimationFrame(() => { el.style.width = w; });
            });
        });
    }

    // 初始化所有组件
    init() {
        this.createParticles();
        this.startTypewriter();
        this.renderStats();
        this.renderMatrix();
        this.renderQuickWins();
        this.initSidebar();

        // 显示欢迎提示
        setTimeout(() => {
            window.toast.success(
                '欢迎使用诊断驾驶舱',
                '数据已加载完成，点击各模块查看详情',
                5000
            );
        }, 1000);
    }
}

// 创建全局实例
window.componentRenderer = new ComponentRenderer();
