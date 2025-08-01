import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { app } from "../firebase/config.js";

const db = getFirestore(app);
let cart = [];
let products = [];

// تهيئة واجهة نقطة البيع
export function initPOS() {
    document.querySelector('[data-page="pos"]').addEventListener('click', loadPOS);
}

async function loadPOS() {
    document.getElementById('welcomeMessage').style.display = 'none';
    document.querySelector('.pos-container').style.display = 'block';
    
    try {
        products = await loadProducts();
        renderProducts(products);
        setupCart();
    } catch (error) {
        console.error('خطأ في تحميل المنتجات:', error);
    }
}

async function loadProducts() {
    const querySnapshot = await getDocs(collection(db, "products"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

function renderProducts(products) {
    const productsGrid = document.querySelector('.products-grid');
    productsGrid.innerHTML = products.map(product => `
        <div class="product-card" data-id="${product.id}">
            ${product.image ? `<img src="${product.image}" alt="${product.name}">` : '<div class="product-icon"><i class="fas fa-box-open"></i></div>'}
            <h3>${product.name}</h3>
            <p>${product.price} ر.س</p>
            <p class="stock-info">المتبقي: ${product.quantity}</p>
        </div>
    `).join('');
    
    // إضافة حدث النقر للمنتجات
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => addToCart(card.dataset.id));
    });
}

function setupCart() {
    document.getElementById('checkoutBtn').addEventListener('click', checkout);
    document.getElementById('clearCartBtn').addEventListener('click', clearCart);
    renderCart();
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    renderCart();
}

function renderCart() {
    const cartItemsElement = document.querySelector('.cart-items');
    const cartTotalElement = document.querySelector('.cart-total');
    
    cartItemsElement.innerHTML = cart.map(item => `
        <div class="cart-item">
            <span>${item.name} x${item.quantity}</span>
            <span>${item.price * item.quantity} ر.س</span>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalElement.textContent = `الإجمالي: ${total} ر.س`;
}

function clearCart() {
    cart = [];
    renderCart();
}

async function checkout() {
    if (cart.length === 0) return;
    
    try {
        // هنا سيتم إضافة كود إتمام عملية البيع
        alert('تمت عملية البيع بنجاح!');
        clearCart();
    } catch (error) {
        console.error('خطأ في إتمام عملية البيع:', error);
        alert('حدث خطأ أثناء عملية البيع');
    }
}
