import { db } from "./firebase/config.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { showToast } from "./app.js";

export class SettingsManager {
    constructor() {
        this.settings = {
            storeName: 'متجرنا',
            storeContact: '0123456789',
            logo: '',
            receiptFooter: 'شكراً لزيارتكم',
            barcodePrefix: 'PROD-',
            lowStockThreshold: 5,
            expiryWarningDays: 7
        };
        this.loadSettings();
    }

    async loadSettings() {
        try {
            const docRef = doc(db, "settings", "storeSettings");
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                this.settings = docSnap.data();
                this.renderSettingsForm();
            }
        } catch (error) {
            console.error("Error loading settings:", error);
        }
    }

    async saveSettings(newSettings) {
        try {
            await setDoc(doc(db, "settings", "storeSettings"), newSettings);
            this.settings = newSettings;
            showToast('تم حفظ الإعدادات بنجاح', 'success');
            return true;
        } catch (error) {
            showToast('خطأ في حفظ الإعدادات', 'error');
            console.error("Error saving settings:", error);
            return false;
        }
    }

    renderSettingsForm() {
        document.getElementById('storeName').value = this.settings.storeName;
        document.getElementById('storeContact').value = this.settings.storeContact;
        document.getElementById('receiptFooter').value = this.settings.receiptFooter;
        document.getElementById('barcodePrefix').value = this.settings.barcodePrefix;
        document.getElementById('lowStockThreshold').value = this.settings.lowStockThreshold;
        document.getElementById('expiryWarningDays').value = this.settings.expiryWarningDays;
    }

    async uploadLogo(file) {
        // هنا يمكنك إضافة كود لرفع الصورة إلى Firebase Storage
        showToast('تم رفع الشعار بنجاح', 'success');
        this.settings.logo = URL.createObjectURL(file);
        return true;
    }
}
