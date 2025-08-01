import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence, collection, addDoc, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import firebaseConfig from "../firebase/config.js";
import { showToast } from "./app.js";

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// تمكين التخزين المحلي
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        showToast('يمكن فتح التطبيق في تبويب واحد فقط للعمل دون اتصال', 'warning');
    } else if (err.code === 'unimplemented') {
        showToast('المتصفح لا يدعم العمل دون اتصال', 'error');
    }
});

// متغير لتخزين العمليات المؤجلة
let pendingOperations = [];

// دالة لحفظ البيانات محلياً عند عدم الاتصال
export async function saveData(collectionName, data) {
    if (navigator.onLine) {
        try {
            const docRef = await addDoc(collection(db, collectionName), data);
            return docRef.id;
        } catch (error) {
            console.error("Error saving data:", error);
            throw error;
        }
    } else {
        const operation = {
            type: 'add',
            collection: collectionName,
            data: data,
            timestamp: new Date().getTime()
        };
        pendingOperations.push(operation);
        saveToLocalStorage('pendingOperations', pendingOperations);
        return `offline-${operation.timestamp}`;
    }
}

// دالة للمزامنة عند عودة الاتصال
export async function syncPendingOperations() {
    if (!navigator.onLine) return;

    const operations = getFromLocalStorage('pendingOperations') || [];
    if (operations.length === 0) return;

    showToast('جاري مزامنة البيانات مع السحابة...', 'info');
    
    for (const op of operations) {
        try {
            if (op.type === 'add') {
                await addDoc(collection(db, op.collection), op.data);
            } else if (op.type === 'update') {
                await setDoc(doc(db, op.collection, op.id), op.data);
            }
        } catch (error) {
            console.error(`Error syncing operation ${op.timestamp}:`, error);
            continue;
        }
    }
    
    // حذف العمليات المزامنة
    pendingOperations = [];
    localStorage.removeItem('pendingOperations');
    showToast('تمت مزامنة جميع البيانات', 'success');
}

// دالة لفحص الاتصال بشكل دوري
setInterval(syncPendingOperations, 30000); // كل 30 ثانية

// تخزين محلي
export function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("LocalStorage error:", e);
    }
}

// استرجاع من التخزين المحلي
export function getFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error("LocalStorage error:", e);
        return null;
    }
}

// إدارة حالة الاتصال
window.addEventListener('online', () => {
    syncPendingOperations();
    showToast('تم استعادة الاتصال بالإنترنت', 'success');
});

window.addEventListener('offline', () => {
    showToast('تعمل الآن في وضع عدم الاتصال، سيتم حفظ البيانات محلياً', 'warning');
});
