// التحقق من حالة الاتصال
function updateOnlineStatus() {
    const statusElement = document.getElementById('connection-status');
    if (navigator.onLine) {
        statusElement.textContent = 'متصل';
        statusElement.classList.remove('offline');
        statusElement.classList.add('online');
        statusElement.innerHTML = '<i class="fas fa-wifi"></i> متصل';
    } else {
        statusElement.textContent = 'غير متصل';
        statusElement.classList.remove('online');
        statusElement.classList.add('offline');
        statusElement.innerHTML = '<i class="fas fa-wifi-slash"></i> غير متصل';
    }
}

// تحديث حالة الاتصال عند التغيير
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// تهيئة حالة الاتصال عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    updateOnlineStatus();
    
    // معالجة تسجيل الدخول
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // هنا يمكنك إضافة التحقق من صحة البيانات
            console.log('محاولة دخول:', { username, password });
            
            // توجيه المستخدم بعد تسجيل الدخول (سيتم تغيير هذا لاحقاً)
            alert('تم تسجيل الدخول بنجاح! سيتم تحويلك إلى لوحة التحكم.');
        });
    }
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
