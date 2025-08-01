import { db } from "./firebase/config.js";
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { saveData, saveToLocalStorage, getFromLocalStorage } from "./offline.js";
import { showToast } from "./app.js";
import JsBarcode from "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js";

// إدارة المنتجات
export class InventoryManager {
    constructor() {
        this.products = [];
        this.loadProducts();
        this.initBarcodeScanner();
    }

    async loadProducts() {
        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            this.products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            saveToLocalStorage('products', this.products);
        } catch (error) {
            console.error("Error loading products:", error);
            this.products = getFromLocalStorage('products') || [];
        }
    }

    async addProduct(product) {
        // توليد الباركود إذا لم يكن موجوداً
        if (!product.barcode) {
            product.barcode = 'PROD-' + Math.floor(100000 + Math.random() * 900000);
        }

        try {
            const productId = await saveData('products', product);
            product.id = productId;
            this.products.push(product);
            saveToLocalStorage('products', this.products);
            
            // إنشاء صورة الباركود
            this.generateBarcodeImage(product.barcode, productId);
            
            showToast('تم إضافة المنتج بنجاح', 'success');
            return productId;
        } catch (error) {
            showToast('خطأ في إضافة المنتج', 'error');
            throw error;
        }
    }

    async updateProduct(id, updates) {
        try {
            if (navigator.onLine) {
                await updateDoc(doc(db, "products", id), updates);
            } else {
                const operation = {
                    type: 'update',
                    collection: 'products',
                    id: id,
                    data: updates,
                    timestamp: new Date().getTime()
                };
                pendingOperations.push(operation);
                saveToLocalStorage('pendingOperations', pendingOperations);
            }

            const index = this.products.findIndex(p => p.id === id);
            if (index !== -1) {
                this.products[index] = { ...this.products[index], ...updates };
                saveToLocalStorage('products', this.products);
            }
            
            showToast('تم تحديث المنتج بنجاح', 'success');
        } catch (error) {
            showToast('خطأ في تحديث المنتج', 'error');
            throw error;
        }
    }

    searchProducts(term) {
        return this.products.filter(product => 
            product.name.includes(term) || 
            product.barcode === term ||
            product.category.includes(term)
        );
    }

    generateBarcodeImage(barcode, productId) {
        const canvas = document.createElement('canvas');
        canvas.id = `barcode-${productId}`;
        document.body.appendChild(canvas);
        
        JsBarcode(canvas, barcode, {
            format: "CODE128",
            lineColor: "#000",
            width: 2,
            height: 50,
            displayValue: true,
            fontSize: 12
        });
        
        return canvas.toDataURL('image/png');
    }

    initBarcodeScanner() {
        // دعم مسح الباركود من الهاتف
        if (window.BarcodeDetector) {
            const barcodeDetector = new BarcodeDetector();
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            document.getElementById('openBarcodeScanner').addEventListener('click', async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                    video.srcObject = stream;
                    video.play();
                    
                    const detectBarcode = () => {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        
                        barcodeDetector.detect(canvas)
                            .then(barcodes => {
                                if (barcodes.length > 0) {
                                    const barcode = barcodes[0].rawValue;
                                    document.getElementById('barcodeInput').value = barcode;
                                    this.handleBarcodeScan(barcode);
                                    video.pause();
                                    stream.getTracks().forEach(track => track.stop());
                                } else {
                                    requestAnimationFrame(detectBarcode);
                                }
                            });
                    };
                    
                    detectBarcode();
                } catch (error) {
                    showToast('خطأ في تشغيل كاميرا المسح', 'error');
                }
            });
        }
    }

    handleBarcodeScan(barcode) {
        const product = this.products.find(p => p.barcode === barcode);
        if (product) {
            document.getElementById('productName').value = product.name;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productQuantity').value = 1;
            showToast(`تم العثور على المنتج: ${product.name}`, 'success');
        } else {
            showToast('لم يتم العثور على المنتج', 'warning');
        }
    }

    checkLowStock() {
        return this.products.filter(p => p.quantity < p.minStock);
    }

    checkExpiredProducts() {
        const today = new Date();
        return this.products.filter(p => new Date(p.expiryDate) < today);
    }
}
