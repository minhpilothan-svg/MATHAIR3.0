// Firebase Security Rules for MathAir Role-Based Access Control
// ============================================================
// 
// Để bảo vệ dữ liệu Firebase của bạn, hãy cập nhật Firestore Security Rules
// Truy cập: https://console.firebase.google.com/project/mathair-8ac04/firestore/rules
//
// Sau đó, dán toàn bộ đoạn code dưới đây vào tab "Rules" và nhấn "Publish"

/*

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ──────────────────────────────────────────────────────────
    // USERS Collection - Quản lý người dùng
    // ──────────────────────────────────────────────────────────
    match /users/{userId} {
      
      // Người dùng có thể đọc hồ sơ của chính mình
      allow read: if request.auth.uid == userId;
      
      // Người dùng có thể cập nhật một số trường nhất định của chính mình
      allow update: if request.auth.uid == userId && 
                       !('role' in request.resource.data.diff.changedKeys()) &&
                       !('createdAt' in request.resource.data.diff.changedKeys());
      
      // Không cho phép tạo tài liệu theo cách thủ công (sẽ tạo qua auth)
      allow create: if false;
      
      // Không cho phép xóa
      allow delete: if false;
      
      // ────────────────────────────────────────────────────────
      // Users > Progress - Dữ liệu tiến độ học tập
      // ────────────────────────────────────────────────────────
      match /progress/{document=**} {
        // Chỉ chính người dùng có thể đọc/ghi tiến độ của mình
        allow read, write: if request.auth.uid == userId;
      }
      
      // ────────────────────────────────────────────────────────
      // Quyền dành cho Admin - Quản lý người dùng
      // ────────────────────────────────────────────────────────
      match /{document=**} {
        allow read, write: if 
          request.auth != null && 
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      }
    }
    
    // ──────────────────────────────────────────────────────────
    // ADMIN_LOGS Collection - Ghi nhật ký hoạt động admin
    // ──────────────────────────────────────────────────────────
    match /admin_logs/{logId} {
      
      // Chỉ admin mới có thể đọc logs
      allow read: if 
        request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      
      // Chỉ admin mới có thể tạo logs
      allow create: if 
        request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' &&
        request.resource.data.userId == request.auth.uid &&
        request.resource.data.timestamp == request.time;
      
      // Không cho phép cập nhật/xóa logs
      allow update, delete: if false;
    }
    
    // ──────────────────────────────────────────────────────────
    // CONTESTS Collection - Cuộc thi
    // ──────────────────────────────────────────────────────────
    match /contests/{contestId} {
      
      // Người dùng đã xác thực có thể đọc cuộc thi
      allow read: if request.auth != null;
      
      // Chỉ admin và reviewer mới có thể tạo/sửa cuộc thi
      allow create, update: if 
        request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'reviewer'];
      
      // Chỉ admin mới có thể xóa
      allow delete: if 
        request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // ──────────────────────────────────────────────────────────
    // SUBMISSIONS Collection - Bài nộp/chấm chữa
    // ──────────────────────────────────────────────────────────
    match /submissions/{submissionId} {
      
      // Người dùng có thể đọc bài nộp của chính mình
      // Reviewer và Admin có thể đọc toàn bộ
      allow read: if 
        request.auth != null && (
          resource.data.userId == request.auth.uid ||
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'reviewer']
        );
      
      // Người dùng có thể nộp bài của chính mình
      allow create: if 
        request.auth != null &&
        request.resource.data.userId == request.auth.uid &&
        request.resource.data.createdAt == request.time;
      
      // Reviewer và Admin có thể cập nhật (chấm chữa)
      allow update: if 
        request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'reviewer'];
      
      // Chỉ admin mới có thể xóa
      allow delete: if 
        request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // ──────────────────────────────────────────────────────────
    // QUIZZES Collection - Bài kiểm tra
    // ──────────────────────────────────────────────────────────
    match /quizzes/{quizId} {
      
      // Người dùng đã xác thực có thể đọc
      allow read: if request.auth != null;
      
      // Chỉ admin và reviewer mới có thể tạo/sửa
      allow create, update: if 
        request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'reviewer'];
      
      // Chỉ admin mới có thể xóa
      allow delete: if 
        request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // ──────────────────────────────────────────────────────────
    // CHAPTERS Collection - Các chương học
    // ──────────────────────────────────────────────────────────
    match /chapters/{chapterId} {
      
      // Người dùng đã xác thực có thể đọc
      allow read: if request.auth != null;
      
      // Chỉ admin mới có thể tạo/sửa/xóa
      allow create, update, delete: if 
        request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // ──────────────────────────────────────────────────────────
    // GRADES Collection - Danh sách khối lớp
    // ──────────────────────────────────────────────────────────
    match /grades/{gradeId} {
      
      // Người dùng đã xác thực có thể đọc
      allow read: if request.auth != null;
      
      // Chỉ admin mới có thể tạo/sửa/xóa
      allow create, update, delete: if 
        request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // ──────────────────────────────────────────────────────────
    // Default rule - Từ chối tất cả truy cập khác
    // ──────────────────────────────────────────────────────────
    match /{document=**} {
      allow read, write: if false;
    }
  }
}

*/

// ============================================================
// HƯỚNG DẪN TRIỂN KHAI SECURITY RULES
// ============================================================
//
// 1. Đăng nhập vào Firebase Console:
//    https://console.firebase.google.com/
//
// 2. Chọn project "mathair-8ac04"
//
// 3. Vào "Firestore Database" > "Rules" tab
//
// 4. Xóa hết code hiện tại và dán toàn bộ code giữa /* */ ở trên
//
// 5. Nhấn "Publish" để lưu các rule mới
//
// ============================================================
// GIẢI THÍCH CÁC RULE CHÍNH
// ============================================================
//
// • USERS: Người dùng chỉ có thể đọc/sửa hồ sơ của chính mình
//   Không thể thay đổi role (chỉ admin mới có thể)
//
// • ADMIN_LOGS: Chỉ admin mới có thể xem nhật ký hoạt động
//
// • CONTESTS: Người dùng đọc được, admin/reviewer sửa được
//
// • SUBMISSIONS: Người dùng chỉ thấy bài của mình
//   Reviewer/admin thấy toàn bộ để chấm chữa
//
// • QUIZZES: Người dùng đọc được, admin/reviewer tạo/sửa
//
// • CHAPTERS & GRADES: Chỉ admin quản lý
//
// ============================================================
// ĐỒ THỊ QUYỀN HẠN
// ============================================================
//
// USER (Người dùng thường)
// ├── Có thể: Xem khóa học, làm quiz, xem hồ sơ
// └── Không thể: Truy cập admin, sửa role người khác
//
// REVIEWER (Người chấm chữa)
// ├── Có thể: Tất cả quyền của User
// ├── Có thể: Xem/chấm bài nộp
// ├── Có thể: Tạo cuộc thi, quiz
// └── Có thể: Truy cập admin panel
//
// ADMIN (Quản trị viên)
// ├── Có thể: Tất cả
// ├── Có thể: Quản lý người dùng & vai trò
// ├── Có thể: Xem toàn bộ dữ liệu
// └── Có thể: Xóa dữ liệu
//
// ============================================================
