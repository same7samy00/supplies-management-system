import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { app } from "../firebase/config.js";
import { showToast } from "./app.js";

const auth = getAuth(app);

// إدارة نافذة تسجيل الدخول
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');

function showLoginModal() {
    loginModal.classList.add('active');
}

function hideLoginModal() {
    loginModal.classList.remove('active');
}

// تسجيل الدخول
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('username').value + '@example.com';
        const password = document.getElementById('password').value;
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            showToast('تم تسجيل الدخول بنجاح', 'success');
            hideLoginModal();
            updateUserInfo(user);
        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
            showToast('خطأ في اسم المستخدم أو كلمة المرور', 'error');
        }
    });
}

// تسجيل الخروج
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            showToast('تم تسجيل الخروج بنجاح', 'success');
            showLoginModal();
        } catch (error) {
            console.error('خطأ في تسجيل الخروج:', error);
            showToast('حدث خطأ أثناء تسجيل الخروج', 'error');
        }
    });
}

// تحديث معلومات المستخدم
function updateUserInfo(user) {
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = user.email.split('@')[0];
    }
}

// التحقق من حالة المصادقة
auth.onAuthStateChanged((user) => {
    if (user) {
        // المستخدم مسجل الدخول
        hideLoginModal();
        updateUserInfo(user);
    } else {
        // لا يوجد مستخدم مسجل الدخول
        showLoginModal();
    }
});
