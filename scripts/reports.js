import { db } from "./firebase/config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { showToast } from "./app.js";
import Chart from "https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js";

export class ReportsManager {
    constructor() {
        this.charts = {};
    }

    async generateSalesReport(startDate, endDate) {
        try {
            const q = query(
                collection(db, "invoices"),
                where("date", ">=", startDate),
                where("date", "<=", endDate)
            );
            
            const querySnapshot = await getDocs(q);
            const invoices = querySnapshot.docs.map(doc => doc.data());
            
            // تحليل البيانات
            const dailySales = {};
            const productSales = {};
            let totalSales = 0;
            
            invoices.forEach(invoice => {
                const date = invoice.date.split('T')[0];
                dailySales[date] = (dailySales[date] || 0) + invoice.total;
                totalSales += invoice.total;
                
                invoice.items.forEach(item => {
                    productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
                });
            });
            
            // عرض النتائج
            this.renderSalesChart(dailySales, totalSales);
            this.renderProductsChart(productSales);
            
            return {
                totalSales: totalSales,
                invoiceCount: invoices.length,
                averageSale: totalSales / invoices.length || 0
            };
        } catch (error) {
            showToast('خطأ في توليد التقرير', 'error');
            console.error("Error generating report:", error);
            return null;
        }
    }

    renderSalesChart(dailySales, totalSales) {
        const ctx = document.getElementById('salesChart').getContext('2d');
        const labels = Object.keys(dailySales).sort();
        const data = labels.map(date => dailySales[date]);
        
        if (this.charts.salesChart) {
            this.charts.salesChart.destroy();
        }
        
        this.charts.salesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'المبيعات اليومية',
                    data: data,
                    backgroundColor: 'rgba(76, 175, 80, 0.7)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: `إجمالي المبيعات: ${totalSales.toFixed(2)} ر.س`
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderProductsChart(productSales) {
        const ctx = document.getElementById('productsChart').getContext('2d');
        const products = Object.keys(productSales);
        const quantities = products.map(p => productSales[p]);
        
        // فرز المنتجات الأكثر مبيعاً
        const sortedIndices = [...Array(products.length).keys()].sort((a, b) => quantities[b] - quantities[a]);
        const topProducts = sortedIndices.slice(0, 5).map(i => products[i]);
        const topQuantities = sortedIndices.slice(0, 5).map(i => quantities[i]);
        
        if (this.charts.productsChart) {
            this.charts.productsChart.destroy();
        }
        
        this.charts.productsChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: topProducts,
                datasets: [{
                    data: topQuantities,
                    backgroundColor: [
                        'rgba(76, 175, 80, 0.7)',
                        'rgba(139, 195, 74, 0.7)',
                        'rgba(205, 220, 57, 0.7)',
                        'rgba(255, 193, 7, 0.7)',
                        'rgba(255, 152, 0, 0.7)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'أكثر المنتجات مبيعاً'
                    }
                }
            }
        });
    }

    async generateInventoryReport() {
        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            const products = querySnapshot.docs.map(doc => doc.data());
            
            const lowStock = products.filter(p => p.quantity < p.minStock);
            const outOfStock = products.filter(p => p.quantity <= 0);
            const expiredProducts = products.filter(p => new Date(p.expiryDate) < new Date());
            
            return {
                totalProducts: products.length,
                totalValue: products.reduce((sum, p) => sum + (p.price * p.quantity), 0),
                lowStockCount: lowStock.length,
                outOfStockCount: outOfStock.length,
                expiredCount: expiredProducts.length
            };
        } catch (error) {
            showToast('خطأ في توليد تقرير المخزون', 'error');
            console.error("Error generating inventory report:", error);
            return null;
        }
    }
}
