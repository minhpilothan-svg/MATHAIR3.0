// sync-users.js - Không dùng import/export, dùng Firestore REST API

// Sử dụng config từ firebase-config.js
// const FIREBASE_PROJECT_ID = "mathair-8ac04";
// const FIREBASE_API_KEY = "AIzaSyDgXDyUryMpFUKJzY6gzNIFfoXSEMy23KU";
// const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// Hàm đẩy dữ liệu Users lên Firestore bằng REST API
async function uploadUsersToCloud(userData, forceOverwrite = false) {
    try {
        const config = window.FIREBASE_CONFIG;
        if (!config) throw new Error("Firebase config not loaded!");
        
        const FIRESTORE_BASE_URL = config.BASE_URL;
        const FIREBASE_API_KEY = config.API_KEY;
        console.log("🚀 Bắt đầu đẩy dữ liệu lên Firestore qua REST API...");
        
        // Kiểm tra xem collection đã có dữ liệu chưa
        console.log("📋 Đang kiểm tra dữ liệu hiện có trong Firestore...");
        const listUrl = `${FIRESTORE_BASE_URL}/users?key=${FIREBASE_API_KEY}`;
        
        const listResponse = await fetch(listUrl);
        const listData = await listResponse.json();
        
        const existingDocs = listData.documents || [];
        if (existingDocs.length > 0) {
            console.log(`☁️ Collection 'users' đã có ${existingDocs.length} tài liệu. Xóa dữ liệu cũ trước...`);
            
            // Xóa từng tài liệu
            for (const doc of existingDocs) {
                const docName = doc.name; // Full path: projects/xxx/databases/(default)/documents/users/user_001
                const deleteUrl = `${docName}?key=${FIREBASE_API_KEY}`;
                const deleteResponse = await fetch(deleteUrl, { method: 'DELETE' });
                if (deleteResponse.ok) {
                    console.log(`🗑️ Đã xóa: ${doc.name.split('/').pop()}`);
                }
            }
            console.log(`🗑️ Đã xóa tất cả ${existingDocs.length} tài liệu cũ`);
        } else {
            console.log("✅ Collection 'users' trống, sẵn sàng thêm dữ liệu mới");
        }

        console.log("🚀 Đang bắt đầu hành trình đưa Users lên mây...");
        let count = 0;
        
        for (const user of userData) {
            try {
                // Chuyển data sang định dạng Firestore
                const firestoreDoc = {
                    fields: {}
                };
                
                // Convert mỗi field sang Firestore format
                for (const [key, value] of Object.entries(user)) {
                    firestoreDoc.fields[key] = firestoreValue(value);
                }
                
                const docId = user.id;
                const createUrl = `${FIRESTORE_BASE_URL}/users?documentId=${docId}&key=${FIREBASE_API_KEY}`;
                
                const response = await fetch(createUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(firestoreDoc)
                });
                
                if (response.ok) {
                    console.log(`✅ Đã đồng bộ: ${user.fullName} (ID: ${user.id})`);
                    count++;
                } else {
                    const error = await response.json();
                    console.error(`❌ Lỗi tạo ${user.fullName}:`, error);
                }
            } catch (itemError) {
                console.error(`❌ Lỗi chuẩn bị ${user?.fullName}:`, itemError);
            }
        }
        
        const message = `✅ Thành công! Đã đẩy ${count}/${userData.length} học viên lên Firestore.`;
        alert(message);
        console.log(`📊 Tổng cộng: ${count} người dùng được đẩy lên thành công!`);
        
        return count;
    } catch (e) {
        console.error("❌ Cú phóng thất bại:", e);
        console.error("Stack:", e.stack);
        alert(`❌ Lỗi: ${e.message}`);
        throw e;
    }
}

// Helper: Convert JS value to Firestore format
function firestoreValue(value) {
    if (value === null || value === undefined) {
        return { nullValue: null };
    }
    
    if (typeof value === 'boolean') {
        return { booleanValue: value };
    }
    
    if (typeof value === 'number') {
        if (Number.isInteger(value)) {
            return { integerValue: value.toString() };
        }
        return { doubleValue: value };
    }
    
    if (typeof value === 'string') {
        return { stringValue: value };
    }
    
    if (Array.isArray(value)) {
        return {
            arrayValue: {
                values: value.map(v => firestoreValue(v))
            }
        };
    }
    
    if (typeof value === 'object') {
        const fields = {};
        for (const [k, v] of Object.entries(value)) {
            fields[k] = firestoreValue(v);
        }
        return { mapValue: { fields } };
    }
    
    return { stringValue: String(value) };
}

// Hàm đẩy dữ liệu Contests lên Firestore bằng REST API
async function uploadContestsToCloud(contestData, forceOverwrite = false) {
    try {
        const config = window.FIREBASE_CONFIG;
        if (!config) throw new Error("Firebase config not loaded!");
        
        const FIRESTORE_BASE_URL = config.BASE_URL;
        const FIREBASE_API_KEY = config.API_KEY;
        
        console.log("🚀 Bắt đầu đẩy dữ liệu Contests lên Firestore qua REST API...");
        
        // Kiểm tra xem collection đã có dữ liệu chưa
        console.log("📋 Đang kiểm tra dữ liệu Contests hiện có trong Firestore...");
        const listUrl = `${FIRESTORE_BASE_URL}/contests?key=${FIREBASE_API_KEY}`;
        
        const listResponse = await fetch(listUrl);
        const listData = await listResponse.json();
        
        const existingDocs = listData.documents || [];
        if (existingDocs.length > 0) {
            console.log(`☁️ Collection 'contests' đã có ${existingDocs.length} tài liệu. Xóa dữ liệu cũ trước...`);
            
            // Xóa từng tài liệu
            for (const doc of existingDocs) {
                const docName = doc.name;
                const deleteUrl = `${docName}?key=${FIREBASE_API_KEY}`;
                const deleteResponse = await fetch(deleteUrl, { method: 'DELETE' });
                if (deleteResponse.ok) {
                    console.log(`🗑️ Đã xóa contest: ${doc.name.split('/').pop()}`);
                }
            }
            console.log(`🗑️ Đã xóa tất cả ${existingDocs.length} contest cũ`);
        } else {
            console.log("✅ Collection 'contests' trống, sẵn sàng thêm dữ liệu mới");
        }

        console.log("🚀 Đang bắt đầu hành trình đưa Contests lên mây...");
        let count = 0;
        
        for (const contest of contestData) {
            try {
                // Chuyển data sang định dạng Firestore
                const firestoreDoc = {
                    fields: {}
                };
                
                // Convert mỗi field sang Firestore format
                for (const [key, value] of Object.entries(contest)) {
                    firestoreDoc.fields[key] = firestoreValue(value);
                }
                
                const docId = contest.id;
                const createUrl = `${FIRESTORE_BASE_URL}/contests?documentId=${docId}&key=${FIREBASE_API_KEY}`;
                
                const response = await fetch(createUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(firestoreDoc)
                });
                
                if (response.ok) {
                    console.log(`✅ Đã đồng bộ: ${contest.title} (ID: ${contest.id})`);
                    count++;
                } else {
                    const error = await response.json();
                    console.error(`❌ Lỗi tạo contest ${contest.title}:`, error);
                }
            } catch (itemError) {
                console.error(`❌ Lỗi chuẩn bị ${contest?.title}:`, itemError);
            }
        }
        
        const message = `✅ Thành công! Đã đẩy ${count}/${contestData.length} cuộc thi lên Firestore.`;
        alert(message);
        console.log(`📊 Tổng cộng: ${count} cuộc thi được đẩy lên thành công!`);
        
        return count;
    } catch (e) {
        console.error("❌ Cú phóng contests thất bại:", e);
        console.error("Stack:", e.stack);
        alert(`❌ Lỗi: ${e.message}`);
        throw e;
    }
}

// Export hàm để dùng ở HTML script
window.uploadUsersToCloud = uploadUsersToCloud;
window.uploadContestsToCloud = uploadContestsToCloud;
