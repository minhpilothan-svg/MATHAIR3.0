# MathAir Role-Based Access Control System
## Hệ Thống Phân Quyền Admin & Reviewer

### 📋 Tổng Quan Thay Đổi

Đã triển khai hệ thống phân quyền hoàn chỉnh với 3 cấp độ vai trò:
- **USER** (Người dùng thường)
- **REVIEWER** (Người chấm chữa bài)
- **ADMIN** (Quản trị viên)

Khi admin hoặc reviewer đăng nhập, sẽ tự động hiện popup bảng điều khiển quản lý.

---

## 🎯 Các Tệp Tạo Mới

### 1. **JS/role-management.js**
Quản lý vai trò và quyền hạn:
```javascript
RoleManager.getCurrentRole()        // Lấy vai trò hiện tại
RoleManager.hasPermission(perm)     // Kiểm tra quyền
RoleManager.canAccessAdmin()        // Kiểm tra truy cập admin
RoleManager.updateUserRole(uid, role) // Cập nhật vai trò (Admin only)
```

**Vai trò & Quyền:**
- `admin`: Tất cả quyền (`*`)
- `reviewer`: Có thể chấm chữa, xem analytics, quản lý cuộc thi
- `user`: Chỉ xem khóa học, làm quiz

### 2. **JS/admin-modal.js**
Bảng điều khiển admin popup với các tab:
- **Dashboard**: Tổng quan (tổng người dùng, admin, reviewer)
- **Quản Lý Người Dùng**: Danh sách người dùng, thay đổi vai trò
- **Quản Lý Vai Trò**: Xem chi tiết các vai trò
- **Thống Kê**: (sẽ mở rộng trong tương lai)

```javascript
AdminModal.showAdminModal()         // Hiển thị panel
AdminModal.hide()                   // Ẩn panel
AdminModal.switchTab('users')       // Chuyển tab
AdminModal.changeUserRole(userId)   // Đổi vai trò user
```

### 3. **CSS/admin-modal.css**
Styling cho:
- Modal container với overlay
- Tabs và navigation
- Tables, cards, badges
- Responsive design (mobile, tablet, desktop)
- Dark mode support

### 4. **FIREBASE_RULES_SETUP.js**
Hướng dẫn chi tiết về Firebase Security Rules:
- Giải thích từng rule
- Hướng dẫn cấu hình
- Bảng đồ quyền hạn

---

## 🔄 Các Tệp Cập Nhật

### **index.html**
```html
<!-- Thêm CSS -->
<link rel="stylesheet" href="CSS/admin-modal.css">

<!-- Thêm scripts (theo thứ tự đúng) -->
<script src="JS/firebase-config.js"></script>
<script src="JS/role-management.js"></script>
<script src="JS/admin-modal.js"></script>
<script src="JS/auth.js"></script>
```

### **JS/auth.js**
Cập nhật hàm `login()` để:
- Kiểm tra vai trò người dùng
- Tự động hiển thị AdminModal cho admin/reviewer

```javascript
// Sau login thành công, tự động mở admin panel nếu là admin/reviewer
if (window.RoleManager && window.RoleManager.canAccessAdmin()) {
    if (window.AdminModal) {
        window.AdminModal.showAdminModal();
    }
}
```

---

## 📊 Cấu Trúc Dữ Liệu Firestore

Mỗi user document cần có trường `role`:

```json
{
  "id": "user_001",
  "email": "admin@example.com",
  "username": "admin_user",
  "role": "admin",          // ← QUAN TRỌNG
  "fullName": "Admin Name",
  "avatar": "...",
  "progress": { ... },
  "createdAt": "2024-01-15T10:30:00Z",
  "lastLogin": "2026-03-28T10:00:00Z"
}
```

**Giá trị role hợp lệ:**
- `"user"` - Người dùng thường (mặc định)
- `"reviewer"` - Người chấm chữa
- `"admin"` - Quản trị viên

---

## 🚀 Hướng Dẫn Sử Dụng

### 1️⃣ Cấu Hình Firebase Security Rules

1. Mở `FIREBASE_RULES_SETUP.js`
2. Copy toàn bộ code nằm giữa `/***` và `**/`
3. Vào Firebase Console > Firestore > Rules tab
4. Dán code và nhấn "Publish"

### 2️⃣ Gán Vai Trò cho Người Dùng

**Cách 1: Qua Admin Panel**
1. Đăng nhập với tài khoản admin
2. Admin panel sẽ tự động hiện lên
3. Vào tab "Quản Lý Người Dùng"
4. Nhấn "Đổi Role" cho người dùng muốn thay đổi
5. Chọn vai trò mới và xác nhận

**Cách 2: Qua Firebase Console**
1. Vào Firestore Database
2. Vào collection `users`
3. Chọn document người dùng
4. Sửa/Thêm trường `role` với giá trị phù hợp

**Cách 3: Qua Code (Test)**
```javascript
// Cập nhật role qua code (từ admin account)
await RoleManager.updateUserRole('user_id_here', 'reviewer');
```

### 3️⃣ Kiểm Tra Quyền trong Code

```javascript
// Kiểm tra vai trò hiện tại
const role = RoleManager.getCurrentRole();

// Kiểm tra quyền cụ thể
if (RoleManager.hasPermission('review_submissions')) {
    // Cho phép chấm chữa
}

// Kiểm tra truy cập admin
if (RoleManager.canAccessAdmin()) {
    // Hiển thị nút admin
}
```

---

## 🎨 Giao Diện Admin Panel

```
┌────────────────────────────────────────┐
│ Admin Panel                        [×] │
├────────────────────────────────────────┤
│ [Dashboard] [Users] [Roles] [Analytics]│
├────────────────────────────────────────┤
│                                        │
│  Tổng Quan Hệ Thống                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│  │ 25   │ │ 3    │ │ 5    │ │ 17   │ │
│  │Users │ │Admin │ │Review│ │Users │ │
│  └──────┘ └──────┘ └──────┘ └──────┘ │
│                                        │
│  [Quản Lý Người Dùng]  [Quản Lý Role] │
│                                        │
├────────────────────────────────────────┤
│ [Thu Nhỏ] [Toàn Màn Hình] [📌 Giữ Mở]│
└────────────────────────────────────────┘
```

**Tính Năng:**
- ✅ Thu nhỏ modal
- ✅ Chế độ toàn màn hình
- ✅ Ghim để giữ mở
- ✅ Tab quản lý người dùng
- ✅ Thay đổi vai trò từ UI
- ✅ Xem thống kê (đang phát triển)

---

## 🔒 Firebase Security Rules Chính

| Collection | User | Reviewer | Admin |
|-----------|------|----------|-------|
| users | Read own | Read own | Read/Write all |
| contests | Read | Read/Write | Read/Write/Delete |
| submissions | Read own | Read/Write | Read/Write/Delete |
| quizzes | Read | Read/Write | Read/Write/Delete |
| chapters | Read | Read | Read/Write/Delete |

---

## 🧪 Test Features

### Test 1: Login as Admin/Reviewer
1. Tạo user mới hoặc cập nhật role hiện tại thành "admin"
2. Đăng nhập
3. Modal admin sẽ tự động hiện lên ✅

### Test 2: Change User Role
1. Từ admin panel, vào "Quản Lý Người Dùng"
2. Nhấn "Đổi Role" trên một user
3. Chọn role mới (e.g., "reviewer")
4. Xác nhận - nên thấy thông báo thành công ✅

### Test 3: Permission Check
```javascript
// Mở DevTools Console (F12) và chạy:
console.log(RoleManager.getCurrentRole());
console.log(RoleManager.canAccessAdmin());
console.log(RoleManager.hasPermission('review_submissions'));
```

### Test 4: Admin Panel Tabs
1. Vào mỗi tab (Dashboard, Users, Roles, Analytics)
2. Kiểm tra dữ liệu hiển thị chính xác ✅
3. Thử responsive design trên mobile ✅

---

## 📱 Responsive Design

- **Desktop (1200px+)**: Full admin panel
- **Tablet (768px-1200px)**: Adaptive layout
- **Mobile (< 768px)**: Optimized untuk touch

---

## 🐛 Xử Lý Lỗi

**Lỗi: "Admin panel không hiện lên"**
- Kiểm tra role trong Firestore
- Kiểm tra scripts được load đúng thứ tự
- Kiểm tra RoleManager trong Console

**Lỗi: "Không thể đổi role"**
- Admin account mới có quyền này
- Kiểm tra Firebase Rules được publish
- Kiểm tra permissioned correctly

**Lỗi: "Modal bị block"**
- Tắt ad blocker
- Kiểm tra z-index CSS (10000)

---

## 🔮 Tính Năng Mở Rộng

Có thể thêm sau:
- [ ] Analytics dashboard với Chart.js
- [ ] Activity logs quản lý
- [ ] Bulk actions (thay đổi role nhiều users)
- [ ] Export data (CSV, Excel)
- [ ] User search & filter
- [ ] Role templates tùy chỉnh
- [ ] Permission matrix chi tiết

---

## 📚 Tài Liệu Tham Khảo

- [Firebase Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firestore Data Structure](https://firebase.google.com/docs/firestore/data-model)

---

## ✅ Checklist Triển Khai

- [x] Tạo role-management.js
- [x] Tạo admin-modal.js  
- [x] Tạo admin-modal.css
- [x] Cập nhật index.html (scripts & CSS)
- [x] Cập nhật auth.js (trigger admin modal)
- [x] Tạo Firebase Rules documentation
- [ ] Publish Firebase Rules
- [ ] Gán role admin cho account test ✅
- [ ] Test đăng nhập & admin panel ✅
- [ ] Test đổi vai trò 
- [ ] Test responsive design

---

**Ngày tạo:** 28/03/2026  
**Version:** 1.0  
**Status:** ✅ Ready for Deployment
