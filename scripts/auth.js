import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from "./firebase/config.js";
import { showToast } from "./app.js";

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const email = `${username}@store.com`;
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = 'index.html';
    } catch (error) {
        showToast('خطأ في تسجيل الدخول: ' + error.message, 'error');
    }
});
