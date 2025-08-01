import { updateOnlineStatus } from './auth.js';
import { initPOS } from './pos.js';

// تهيئة Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import firebaseConfig from '../firebase/config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// تمكين التخزين المحلي لـ Firestore
enableIndexedDbPersistence(db).catch((err) => {
    console.error("فشل في تمكين التخزين المحلي:", err);
});

// إدارة حالة الاتصال
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
document.addEventListener('DOMContentLoaded', updateOnlineStatus);

// إدارة القائمة الجانبية
document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('mainContent').classList.toggle('with-sidebar');
});

// تسجيل Service Worker لتطبيق PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// تهيئة وحدات النظام
initPOS();

// التنقل بين الصفحات
document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = e.target.getAttribute('data-page');
        loadPage(page);
    });
});

function loadPage(page) {
    // إخفاء جميع الأقسام
    document.querySelectorAll('.page-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // إظهار القسم المطلوب
    document.getElementById('welcomeMessage').style.display = 'none';
    document.getElementById(`${page}Section`).style.display = 'block';
}
