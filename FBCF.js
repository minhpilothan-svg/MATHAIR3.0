// Firebase Configuration - Using CDN
// Được load trước các file khác

const firebaseConfig = {
  apiKey: "AIzaSyDgXDyUryMpFUKJzY6gzNIFfoXSEMy23KU",
  authDomain: "mathair-8ac04.firebaseapp.com",
  projectId: "mathair-8ac04",
  storageBucket: "mathair-8ac04.firebasestorage.app",
  messagingSenderId: "328600425826",
  appId: "1:328600425826:web:5d1f2630dd0948d052083b",
  measurementId: "G-ZGJVTV66V1"
};

// Khởi tạo Firebase - lưu vào window object để dùng ở khắp nơi
let db = null;
let app = null;

// Hàm khởi tạo Firebase từ CDN
function initializeFirebase() {
  if (!app) {
    try {
      app = firebase.initializeApp(firebaseConfig);
      db = firebase.firestore();
      console.log("✅ Firebase Firestore initialized successfully!");
      window.db = db; // Lưu vào window object
      window.app = app;
      window.firebase = firebase;
      return db;
    } catch (e) {
      console.error("❌ Lỗi khởi tạo Firebase:", e);
      return null;
    }
  }
  return db;
}

// Gọi khởi tạo ngay khi FBCF.js được load
if (typeof firebase !== 'undefined') {
  console.log("Firebase SDK detected, initializing...");
  setTimeout(() => {
    initializeFirebase();
  }, 100);
} else {
  console.warn("⚠️ Firebase SDK chưa được load. Chờ Firebase SDK được tải...");
  // Chạy lại khi Firebase được load
  setTimeout(() => {
    if (typeof firebase !== 'undefined') {
      console.log("Firebase SDK loaded, initializing now...");
      initializeFirebase();
    } else {
      console.error("❌ Firebase SDK failed to load!");
    }
  }, 2000);
}