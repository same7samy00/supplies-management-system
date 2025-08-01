import { auth } from "./firebase/config.js";

// دالة لعرض التنبيهات
export function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-message">
            <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
            ${message}
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 5000);
}

// إدارة حالة المصادقة
auth.onAuthStateChanged((user) => {
    if (!user && !window.location.pathname.endsWith('login.html')) {
        window.location.href = 'login.html';
    }
});
