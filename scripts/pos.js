import { db } from "./firebase/config.js";
import { collection, addDoc, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { saveData } from "./offline.js";
import { showToast } from "./app.js";
import { InventoryManager } from "./inventory.js";

export class POSSystem {
    constructor() {
        this.cart = [];
        this.inventory = new InventoryManager();
        this.currentCustomer = null;
        this.initPOS();
    }

    initPOS() {
        this.setupEventListeners();
        this.loadCustomers();
        this.setupBarcodeSync();
    }

    setupEventListeners() {
        document.getElementById('addToCart').addEventListener('click', () => this.addToCart());
        document.getElementById('checkout').addEventListener('click', () => this.checkout());
        document.getElementById('clearCart').addEventListener('click', () => this.clearCart());
        document.getElementById('applyDiscount').addEventListener('click', () => this.applyDiscount());
        document.getElementById('selectCustomer').addEventListener('change', (e) => this.selectCustomer(e));
        document.getElementById('newCustomer').addEventListener('click', () => this.addNewCustomer());
    }

    async addToCart() {
        const barcode = document.getElementById('barcodeInput').value;
        const quantity = parseFloat(document.getElementById('quantityInput').value) || 1;
        
        if (!barcode) {
            showToast('الرجاء إدخال باركود المنتج', 'warning');
            return;
        }

        let product;
        if (navigator.onLine) {
            const q = query(collection(db, "products"), where("barcode", "==", barcode));
            const querySnapshot = await getDocs(q);
            product = querySnapshot.docs[0]?.data();
        } else {
            product = this.inventory.products.find(p => p.barcode === barcode);
        }

        if (!product) {
            showToast('المنتج غير موجود', 'error');
            return;
        }

        if (product.quantity < quantity) {
            showToast(`الكمية المتاحة غير كافية (المتبقي: ${product.quantity})`, 'warning');
            return;
        }

        const existingItem = this.cart.find(item => item.barcode === barcode);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                ...product,
                quantity: quantity,
                originalPrice: product.price,
                discount: 0
            });
        }

        this.updateCartDisplay();
        document.getElementById('barcodeInput').value = '';
        document.getElementById('quantityInput').value = '1';
        document.getElementById('barcodeInput').focus();
    }

    updateCartDisplay() {
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        const cartSubtotal = document.getElementById('cartSubtotal');
        const cartDiscount = document.getElementById('cartDiscount');
        
        cartItems.innerHTML = '';
        let subtotal = 0;
        let totalDiscount = 0;

        this.cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            const itemDiscount = (item.originalPrice - item.price) * item.quantity;
            subtotal += itemTotal;
            totalDiscount += itemDiscount;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${item.price.toFixed(2)} ر.س</td>
                <td>${itemTotal.toFixed(2)} ر.س</td>
                <td>
                    <button class="btn btn-sm btn-danger remove-item" data-barcode="${item.barcode}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            cartItems.appendChild(row);
        });

        cartSubtotal.textContent = subtotal.toFixed(2) + ' ر.س';
        cartDiscount.textContent = totalDiscount.toFixed(2) + ' ر.س';
        cartTotal.textContent = (subtotal - totalDiscount).toFixed(2) + ' ر.س';

        // إضافة أحداث لإزالة العناصر
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const barcode = btn.getAttribute('data-barcode');
                this.removeFromCart(barcode);
            });
        });
    }

    removeFromCart(barcode) {
        this.cart = this.cart.filter(item => item.barcode !== barcode);
        this.updateCartDisplay();
    }

    clearCart() {
        this.cart = [];
        this.updateCartDisplay();
    }

    applyDiscount() {
        const discountType = document.getElementById('discountType').value;
        const discountValue = parseFloat(document.getElementById('discountValue').value) || 0;
        
        if (discountType === 'percentage') {
            this.cart.forEach(item => {
                item.price = item.originalPrice * (1 - discountValue / 100);
                item.discount = item.originalPrice - item.price;
            });
        } else if (discountType === 'fixed') {
            const discountPerItem = discountValue / this.cart.reduce((sum, item) => sum + item.quantity, 0);
            this.cart.forEach(item => {
                item.price = item.originalPrice - discountPerItem;
                item.discount = item.originalPrice - item.price;
            });
        } else if (discountType === 'product') {
            const barcode = document.getElementById('discountProduct').value;
            const product = this.cart.find(item => item.barcode === barcode);
            if (product) {
                product.price = product.originalPrice * (1 - discountValue / 100);
                product.discount = product.originalPrice - product.price;
            }
        }
        
        this.updateCartDisplay();
    }

    async checkout() {
        if (this.cart.length === 0) {
            showToast('لا توجد عناصر في السلة', 'warning');
            return;
        }

        const paymentMethod = document.getElementById('paymentMethod').value;
        const amountReceived = parseFloat(document.getElementById('amountReceived').value) || 0;
        const total = this.getTotal();
        
        if (paymentMethod === 'cash' && amountReceived < total) {
            showToast('المبلغ المدفوع أقل من الإجمالي', 'error');
            return;
        }

        const invoice = {
            date: new Date().toISOString(),
            items: this.cart,
            subtotal: this.getSubtotal(),
            discount: this.getTotalDiscount(),
            total: total,
            paymentMethod: paymentMethod,
            amountReceived: amountReceived,
            change: paymentMethod === 'cash' ? amountReceived - total : 0,
            customerId: this.currentCustomer?.id || null,
            status: paymentMethod === 'cash' ? 'paid' : 'pending',
            userId: auth.currentUser?.uid
        };

        try {
            // حفظ الفاتورة
            const invoiceId = await saveData('invoices', invoice);
            
            // تحديث المخزون
            await this.updateInventory();
            
            // تحديث رصيد العميل إذا كان هناك مديونية
            if (paymentMethod === 'credit' && this.currentCustomer) {
                await this.updateCustomerBalance(total);
            }
            
            // طباعة الفاتورة
            this.printInvoice(invoiceId, invoice);
            
            showToast('تمت عملية البيع بنجاح', 'success');
            this.clearCart();
        } catch (error) {
            showToast('حدث خطأ أثناء عملية البيع', 'error');
            console.error('Checkout error:', error);
        }
    }

    async updateInventory() {
        const batch = [];
        
        this.cart.forEach(item => {
            const newQuantity = item.quantity - item.quantity;
            const productRef = doc(db, "products", item.id);
            batch.push(updateDoc(productRef, { quantity: newQuantity }));
        });

        await Promise.all(batch);
    }

    async updateCustomerBalance(amount) {
        if (!this.currentCustomer) return;
        
        const customerRef = doc(db, "customers", this.currentCustomer.id);
        await updateDoc(customerRef, {
            balance: (this.currentCustomer.balance || 0) + amount,
            lastPurchase: new Date().toISOString()
        });
    }

    printInvoice(invoiceId, invoice) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <title>فاتورة #${invoiceId}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                    .invoice-header { text-align: center; margin-bottom: 20px; }
                    .invoice-details { margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 8px; text-align: right; border-bottom: 1px solid #ddd; }
                    .total-row { font-weight: bold; }
                    .footer { margin-top: 30px; text-align: center; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="invoice-header">
                    <h2>فاتورة بيع</h2>
                    <p>${document.getElementById('storeName').value || 'متجرنا'}</p>
                </div>
                
                <div class="invoice-details">
                    <p><strong>رقم الفاتورة:</strong> ${invoiceId}</p>
                    <p><strong>التاريخ:</strong> ${new Date(invoice.date).toLocaleString()}</p>
                    ${this.currentCustomer ? `<p><strong>العميل:</strong> ${this.currentCustomer.name}</p>` : ''}
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>المنتج</th>
                            <th>الكمية</th>
                            <th>السعر</th>
                            <th>الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>${item.price.toFixed(2)} ر.س</td>
                                <td>${(item.price * item.quantity).toFixed(2)} ر.س</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3">المجموع الفرعي</td>
                            <td>${invoice.subtotal.toFixed(2)} ر.س</td>
                        </tr>
                        <tr>
                            <td colspan="3">الخصم</td>
                            <td>${invoice.discount.toFixed(2)} ر.س</td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="3">الإجمالي النهائي</td>
                            <td>${invoice.total.toFixed(2)} ر.س</td>
                        </tr>
                        ${invoice.paymentMethod === 'cash' ? `
                            <tr>
                                <td colspan="3">المبلغ المدفوع</td>
                                <td>${invoice.amountReceived.toFixed(2)} ر.س</td>
                            </tr>
                            <tr>
                                <td colspan="3">الباقي</td>
                                <td>${invoice.change.toFixed(2)} ر.س</td>
                            </tr>
                        ` : ''}
                    </tfoot>
                </table>
                
                <div class="footer">
                    <p>شكراً لزيارتكم</p>
                    <p>${document.getElementById('storeContact').value || 'للتواصل: 0123456789'}</p>
                </div>
                
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(() => window.close(), 1000);
                    };
                </script>
            </body>
            </html>
        `);
    }

    setupBarcodeSync() {
        // مزامنة الباركود بين الأجهزة
        if (typeof BroadcastChannel !== 'undefined') {
            const barcodeChannel = new BroadcastChannel('barcode_scanner');
            
            barcodeChannel.addEventListener('message', (event) => {
                if (event.data.type === 'barcode_scanned') {
                    document.getElementById('barcodeInput').value = event.data.barcode;
                    this.addToCart();
                }
            });
            
            document.getElementById('openBarcodeScanner').addEventListener('click', () => {
                window.open('barcode-scanner.html', 'BarcodeScanner', 'width=400,height=600');
            });
        }
    }

    getSubtotal() {
        return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    getTotalDiscount() {
        return this.cart.reduce((sum, item) => sum + (item.discount * item.quantity), 0);
    }

    getTotal() {
        return this.getSubtotal() - this.getTotalDiscount();
    }
}
