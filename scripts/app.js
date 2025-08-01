// تهيئة النظام
document.addEventListener('DOMContentLoaded', function() {
    // إخفاء شريط التحميل بعد تحميل الصفحة
    setTimeout(() => {
        document.querySelector('.loader-wrapper').style.opacity = '0';
        setTimeout(() => {
            document.querySelector('.loader-wrapper').style.display = 'none';
        }, 300);
    }, 500);
    
    // إدارة القائمة الجانبية
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        mainContent.classList.toggle('with-sidebar');
    });
    
    // إدارة التنقل بين الصفحات
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const contentSections = document.querySelectorAll('.content-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // إزالة التنشيط من جميع الروابط
            navLinks.forEach(navLink => {
                navLink.parentElement.classList.remove('active');
            });
            
            // إضافة التنشيط للرابط الحالي
            this.parentElement.classList.add('active');
            
            // إخفاء جميع الأقسام
            contentSections.forEach(section => {
                section.classList.remove('active');
            });
            
            // إظهار القسم المحدد
            const target = this.getAttribute('href').substring(1);
            document.getElementById(`${target}Section`).classList.add('active');
            
            // إغلاق القائمة الجانبية على الأجهزة الصغيرة
            if (window.innerWidth < 992) {
                sidebar.classList.remove('active');
                mainContent.classList.remove('with-sidebar');
            }
        });
    });
    
    // التحقق من حالة الاتصال بالإنترنت
    function updateConnectionStatus() {
        const connectionStatus = document.getElementById('connectionStatus');
        if (navigator.onLine) {
            connectionStatus.classList.remove('offline');
            connectionStatus.classList.add('online');
            connectionStatus.innerHTML = '<i class="fas fa-wifi"></i>';
            connectionStatus.title = 'متصل بالإنترنت';
        } else {
            connectionStatus.classList.remove('online');
            connectionStatus.classList.add('offline');
            connectionStatus.innerHTML = '<i class="fas fa-wifi-slash"></i>';
            connectionStatus.title = 'غير متصل بالإنترنت';
        }
    }
    
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    updateConnectionStatus();
    
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
});

// تصدير الدوال الأساسية
export function showLoader() {
    document.querySelector('.loader-wrapper').style.display = 'flex';
    document.querySelector('.loader-wrapper').style.opacity = '1';
}

export function hideLoader() {
    document.querySelector('.loader-wrapper').style.opacity = '0';
    setTimeout(() => {
        document.querySelector('.loader-wrapper').style.display = 'none';
    }, 300);
}

export function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                          type === 'error' ? 'fa-times-circle' : 
                          type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
        </div>
        <div class="toast-message">${message}</div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // إغلاق Toast عند النقر على الزر
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
    
    // إزالة Toast تلقائياً بعد 5 ثواني
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
}
