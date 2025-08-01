import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { app } from "../firebase/config.js";

const auth = getAuth(app);

// تسجيل الدخول
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('username').value + '@example.com';
    const password = document.getElementById('password').value;
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('تم تسجيل الدخول:', user);
        hideLoginModal();
        updateUserInfo(user);
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        alert('خطأ في اسم المستخدم أو كلمة المرور');
    }
});

// تسجيل الخروج
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    try {
        await signOut(auth);
        console.log('تم تسجيل الخروج');
        showLoginModal();
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
    }
});

// تحديث معلومات المستخدم
function updateUserInfo(user) {
    const userInfoElement = document.getElementById('userInfo');
    if (userInfoElement) {
        userInfoElement.innerHTML = `
            <span>${user.email.split('@')[0]}</span>
            <i class="fas fa-user-circle" style="margin-right: 8px; font-size: 1.2rem;"></i>
        `;
    }
}

// إظهار/إخفاء نافذة تسجيل الدخول
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('mainContent').classList.remove('with-sidebar');
}

function hideLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

// التحقق من حالة المصادقة عند التحميل
auth.onAuthStateChanged((user) => {
    if (user) {
        hideLoginModal();
        updateUserInfo(user);
    } else {
        showLoginModal();
    }
});

// إغلاق نافذة تسجيل الدخول
document.querySelector('.close-btn')?.addEventListener('click', hideLoginModal);
