import { db } from "./firebase/config.js";
import { collection, addDoc, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { saveData } from "./offline.js";
import { showToast } from "./app.js";

export class CustomerManager {
    constructor() {
        this.customers = [];
        this.loadCustomers();
    }

    async loadCustomers() {
        try {
            const querySnapshot = await getDocs(collection(db, "customers"));
            this.customers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.renderCustomerSelect();
        } catch (error) {
            console.error("Error loading customers:", error);
            this.customers = getFromLocalStorage('customers') || [];
        }
    }

    async addCustomer(customerData) {
        try {
            const customerId = await saveData('customers', customerData);
            customerData.id = customerId;
            this.customers.push(customerData);
            this.renderCustomerSelect();
            showToast('تم إضافة العميل بنجاح', 'success');
            return customerId;
        } catch (error) {
            showToast('خطأ في إضافة العميل', 'error');
            throw error;
        }
    }

    async updateCustomer(id, updates) {
        try {
            if (navigator.onLine) {
                await updateDoc(doc(db, "customers", id), updates);
            } else {
                const operation = {
                    type: 'update',
                    collection: 'customers',
                    id: id,
                    data: updates,
                    timestamp: new Date().getTime()
                };
                pendingOperations.push(operation);
                saveToLocalStorage('pendingOperations', pendingOperations);
            }

            const index = this.customers.findIndex(c => c.id === id);
            if (index !== -1) {
                this.customers[index] = { ...this.customers[index], ...updates };
                saveToLocalStorage('customers', this.customers);
            }
            
            showToast('تم تحديث بيانات العميل', 'success');
        } catch (error) {
            showToast('خطأ في تحديث بيانات العميل', 'error');
            throw error;
        }
    }

    renderCustomerSelect() {
        const select = document.getElementById('selectCustomer');
        select.innerHTML = `
            <option value="">اختر عميل...</option>
            ${this.customers.map(customer => `
                <option value="${customer.id}">
                    ${customer.name} - ${customer.phone} (رصيد: ${customer.balance || 0} ر.س)
                </option>
            `).join('')}
        `;
    }

    getCustomerById(id) {
        return this.customers.find(c => c.id === id);
    }

    async getCustomerInvoices(customerId) {
        try {
            const q = query(collection(db, "invoices"), where("customerId", "==", customerId));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error getting customer invoices:", error);
            return [];
        }
    }

    async addPayment(customerId, amount, invoiceIds = []) {
        try {
            const paymentData = {
                customerId: customerId,
                amount: amount,
                date: new Date().toISOString(),
                invoices: invoiceIds,
                userId: auth.currentUser?.uid
            };

            await saveData('payments', paymentData);
            
            // تحديث رصيد العميل
            const customer = this.getCustomerById(customerId);
            if (customer) {
                await this.updateCustomer(customerId, {
                    balance: (customer.balance || 0) - amount
                });
            }
            
            showToast('تم تسجيل السداد بنجاح', 'success');
        } catch (error) {
            showToast('خطأ في تسجيل السداد', 'error');
            throw error;
        }
    }
}
