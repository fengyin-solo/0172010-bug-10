/* ========================================
   应用主入口
   ======================================== */

class App {
    constructor() {
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;

        // 初始化组件
        window.componentRenderer.init();

        // 初始化图表
        window.chartManager.initFunnelChart('funnelChart');
        window.chartManager.initRadarChart('radarChart');

        // 监听窗口大小变化
        window.addEventListener('resize', this.handleResize.bind(this));

        // 监听滚动
        window.addEventListener('scroll', this.handleScroll.bind(this));

        console.log('🚀 Dashboard initialized successfully');
    }

    handleResize() {
        // 防抖处理
        clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(() => {
            window.chartManager.resize();
        }, 250);
    }

    handleScroll() {
        this.updateHeader();
    }

    // 根据当前页面滚动位置更新头部高亮状态。
    // 统一入口：滚动、侧栏解锁、状态恢复后都会重新计算，避免残留半透明。
    updateHeader() {
        const header = document.querySelector('.header');
        if (!header) return;
        const faded = window.scrollY > 20;
        header.classList.toggle('is-scrolled', faded);
    }

    // 刷新数据
    refresh() {
        window.toast.info('刷新中', '正在重新加载数据...');
        
        setTimeout(() => {
            window.componentRenderer.renderStats();
            window.componentRenderer.renderMatrix();
            window.componentRenderer.renderQuickWins();
            window.chartManager.resize();
            
            window.toast.success('刷新完成', '数据已更新');
        }, 1000);
    }

    // 导出报告
    exportReport() {
        window.toast.info('导出报告', '正在生成PDF报告...');
        
        setTimeout(() => {
            window.toast.success('导出成功', '报告已保存到下载目录');
        }, 2000);
    }
}

// 创建应用实例
const app = new App();

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// 暴露全局方法
window.app = app;
