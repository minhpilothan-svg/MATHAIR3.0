// load-firestore.js - Load dữ liệu từ Firestore REST API

// Sử dụng config từ firebase-config.js
// const FIREBASE_PROJECT_ID = "mathair-8ac04";
// const FIREBASE_API_KEY = "AIzaSyDgXDyUryMpFUKJzY6gzNIFfoXSEMy23KU";
// const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// Helper để get config
function getFirestoreConfig() {
    const config = window.FIREBASE_CONFIG;
    if (!config) {
        throw new Error("Firebase config not loaded! Load firebase-config.js first.");
    }
    return {
        baseUrl: config.BASE_URL,
        apiKey: config.API_KEY
    };
}

// Hàm convert Firestore format về JS value
function firestoreToValue(field) {
    if (field.stringValue) return field.stringValue;
    if (field.integerValue) return parseInt(field.integerValue);
    if (field.doubleValue) return field.doubleValue;
    if (field.booleanValue) return field.booleanValue;
    if (field.nullValue !== undefined) return null;
    if (field.arrayValue) {
        return (field.arrayValue.values || []).map(v => firestoreToValue(v));
    }
    if (field.mapValue && field.mapValue.fields) {
        const obj = {};
        for (const [key, value] of Object.entries(field.mapValue.fields)) {
            obj[key] = firestoreToValue(value);
        }
        return obj;
    }
    if (field.timestampValue) return new Date(field.timestampValue);
    return null;
}

// Hàm load users từ Firestore
async function loadUsersFromFirestore() {
    try {
        console.log("📥 Đang tải dữ liệu Users từ Firestore...");
        
        const config = getFirestoreConfig();
        const listUrl = `${config.baseUrl}/users?key=${config.apiKey}`;
        const response = await fetch(listUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const documents = data.documents || [];
        
        console.log(`✅ Tải được ${documents.length} users từ Firestore`);
        
        // Convert Firestore documents sang JS objects
        const users = documents.map(doc => {
            const user = {};
            if (doc.fields) {
                for (const [key, value] of Object.entries(doc.fields)) {
                    user[key] = firestoreToValue(value);
                }
            }
            return user;
        });
        
        console.log("📊 Users loaded:", users.length);
        return users;
    } catch (error) {
        console.error("❌ Lỗi tải dữ liệu Users:", error);
        return [];
    }
}

// Hàm load contests từ Firestore
async function loadContestsFromFirestore() {
    try {
        console.log("📥 Đang tải dữ liệu Contests từ Firestore...");
        
        const config = getFirestoreConfig();
        const listUrl = `${config.baseUrl}/contests?key=${config.apiKey}`;
        const response = await fetch(listUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const documents = data.documents || [];
        
        console.log(`✅ Tải được ${documents.length} contests từ Firestore`);
        
        // Convert Firestore documents sang JS objects
        const contests = documents.map(doc => {
            const contest = {};
            if (doc.fields) {
                for (const [key, value] of Object.entries(doc.fields)) {
                    contest[key] = firestoreToValue(value);
                }
            }
            return contest;
        });
        
        console.log("📊 Contests loaded:", contests.length);
        return contests;
    } catch (error) {
        console.error("❌ Lỗi tải dữ liệu Contests:", error);
        return [];
    }
}

// Hàm tải tất cả dữ liệu từ Firestore
async function loadAllDataFromFirestore() {
    try {
        console.log("🚀 Bắt đầu tải tất cả dữ liệu từ Firestore...");
        
        const [users, contests] = await Promise.all([
            loadUsersFromFirestore(),
            loadContestsFromFirestore()
        ]);
        
        const allData = {
            users,
            contests,
            loadedAt: new Date().toISOString()
        };
        
        console.log("✅ Tất cả dữ liệu đã được tải thành công!");
        console.log("📊 Summary:", {
            users: users.length,
            contests: contests.length
        });
        
        return allData;
    } catch (error) {
        console.error("❌ Lỗi tải dữ liệu:", error);
        return { users: [], contests: [], loadedAt: new Date().toISOString() };
    }
}

// Export functions
window.loadUsersFromFirestore = loadUsersFromFirestore;
window.loadContestsFromFirestore = loadContestsFromFirestore;
window.loadAllDataFromFirestore = loadAllDataFromFirestore;

// Auto-load dữ liệu khi trang load (nếu user đã login)
document.addEventListener('DOMContentLoaded', async () => {
    // Chỉ load nếu là admin page
    if (window.location.pathname.includes('admin')) {
        console.log("🔄 Admin page detected, loading data from Firestore...");
        // Có thể gọi loadAllDataFromFirestore() để auto-load
    }
});