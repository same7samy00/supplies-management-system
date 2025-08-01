import { InventoryManager } from './inventory.js';
import { POSSystem } from './pos.js';
import { CustomerManager } from './customers.js';
import { SettingsManager } from './settings.js';
import { ReportsManager } from './reports.js';
import { auth } from './firebase/config.js';
import { showToast } from './app.js';

// تهيئة جميع الوحدات
const inventoryManager = new InventoryManager();
const posSystem = new POSSystem();
const customerManager = new CustomerManager();
const settingsManager = new SettingsManager();
const reportsManager = new ReportsManager();

// إدارة الصفحات
function setupPageNavigation() {
    const pages = {
        'dashboard': () => loadDashboard(),
        'pos': () => posSystem.initPOS(),
        'inventory': () => inventoryManager.loadProducts(),
        'customers': () => customerManager.loadCustomers(),
        'reports': () => loadReports(),
        'settings': () => settingsManager.loadSettings()
    };

    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.getAttribute('data-page');
            pages[page]?.();
        });
    });
}

async function loadDashboard() {
    try {
        // تحميل إحصائيات سريعة
        const inventoryReport = await reportsManager.generateInventoryReport();
        const salesReport = await reportsManager.generateSalesReport(
            new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
            new Date().toISOString()
        );

        // عرض الإحصائيات على لوحة التحكم
        document.getElementById('totalProducts').textContent = inventoryReport?.totalProducts || 0;
        document.getElementById('inventoryValue').textContent = inventoryReport?.totalValue.toFixed(2) || '0.00';
        document.getElementById('monthlySales').textContent = salesReport?.totalSales.toFixed(2) || '0.00';
        document.getElementById('lowStockItems').textContent = inventoryReport?.lowStockCount || 0;
        
    } catch (error) {
        console.error("Error loading dashboard:", error);
    }
}

async function loadReports() {
    document.getElementById('generateSalesReport').addEventListener('click', async () => {
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;
        
        if (!startDate || !endDate) {
            showToast('الرجاء تحديد تاريخ البدء والانتهاء', 'warning');
            return;
        }
        
        await reportsManager.generateSalesReport(startDate, endDate);
    });
    
    document.getElementById('generateInventoryReport').addEventListener('click', async () => {
        const report = await reportsManager.generateInventoryReport();
        if (report) {
            document.getElementById('totalProductsValue').textContent = report.totalProducts;
            document.getElementById('inventoryTotalValue').textContent = report.totalValue.toFixed(2);
            document.getElementById('lowStockCount').textContent = report.lowStockCount;
            document.getElementById('outOfStockCount').textContent = report.outOfStockCount;
        }
    });
}

// التحقق من حالة المصادقة
auth.onAuthStateChanged((user) => {
    if (user) {
        // المستخدم مسجل الدخول - تهيئة النظام
        setupPageNavigation();
        loadDashboard();
    } else {
        // لا يوجد مستخدم مسجل الدخول
        window.location.href = 'login.html';
    }
});
