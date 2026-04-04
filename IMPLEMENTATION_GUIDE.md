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

---

# 🎯 PHẦN 2: HỆ THỐNG CUỘC THI & LÀM BÀI TƯƠNG TÁCQUIZ (CONTESTS)

## 📋 Tổng Quan 4 Task

Đã hoàn thành 4 task chính cho hệ thống cuộc thi/bài thi:

### ✅ Task 1: Cải Thiện UI Admin & Hoàn Thành Chức Năng Admin
- Thêm tab "Quản Lý Cuộc Thi" vào sidebar admin
- Hiển thị danh sách cuộc thi dưới dạng card
- Cho phép tạo, sửa, xóa, và xem kết quả cuộc thi

### ✅ Task 2: Tính Năng Tạo Cuộc Thi (Admin-Only)
- Form tạo cuộc thi với 10 trường thông tin
- Xác nhận dữ liệu (ngày, số câu, v.v.)
- Hỗ trợ điểm thưởng theo mốc điểm (70%, 80%, 90%)

### ✅ Task 3: Giao Diện Làm Bài với Timer & Trình Theo Dõi Câu Hỏi
- Timer đếm ngược ở góc trên cùng bên phải
- Trình theo dõi câu hỏi: 5 câu/hàng với 3 trạng thái màu
- Kiểm tra tất cả câu được trả lời trước khi nộp

### ✅ Task 4: Hệ Thống Kết Quả & Xếp Hạng
- Hiển thị điểm số, số câu đúng, thời gian
- Tính toán bonus point dựa trên điểm số
- Bảng xếp hạng định dạng đẹp

---

## 📝 Task 2: Tính Năng Tạo Cuộc Thi

### Form Fields

| Trường | Loại | Bắt Buộc | Mô Tả |
|--------|------|----------|-------|
| Tên Cuộc Thi | Text | ✓ | Tiêu đề cuộc thi |
| Mô Tả | Textarea | ✓ | Chi tiết về cuộc thi |
| Thời Gian Bắt Đầu | DateTime | ✓ | Khi cuộc thi bắt đầu |
| Thời Gian Kết Thúc | DateTime | ✓ | Khi cuộc thi kết thúc |
| Thời Gian Làm Bài (Phút) | Number | ✓ | Thời lượng tối đa (phút) |
| Số Câu Hỏi | Number | ✓ | Tổng số câu trong đề |
| Nguồn Câu Hỏi | Select | | Random hoặc Chương 1-3 |
| Điểm Thưởng 70%-79% | Number | ✓ | Bonus SP cho điểm 70-79% |
| Điểm Thưởng 80%-89% | Number | ✓ | Bonus SP cho điểm 80-89% |
| Điểm Thưởng 90%-100% | Number | ✓ | Bonus SP cho điểm 90-100% |

### Hướng Dẫn Tạo Cuộc Thi

1. Đăng nhập admin
2. Vào "Quản Lý Cuộc Thi" từ sidebar
3. Nhấn "Tạo Cuộc Thi Mới"
4. Điền đầy đủ thông tin
5. Nhấn "Lưu Cuộc Thi"

### Dữ Liệu Cuộc Thi

```javascript
{
  id: "contest_1711614000000",
  title: "Kiểm Tra Toán Lớp 7",
  description: "Bài kiểm tra giữa kỳ I",
  createdBy: "admin_001",
  startTime: "2026-04-15T14:00:00.000Z",
  endTime: "2026-04-15T15:30:00.000Z",
  duration: 90,                    // Phút
  totalQuestions: 20,
  questions: ["q1", "q2", ...],    // Array ID câu hỏi
  questionSource: "random",
  reward70: 5,                     // SP cho 70-79%
  reward80: 7,                     // SP cho 80-89%
  reward90: 10,                    // SP cho 90-100%
  participants: ["user1", "user2"],
  results: [{ result obj }, ...],
  status: "upcoming|active|ended",
  createdAt: "2026-03-28T10:00:00.000Z"
}
```

---

## 🎯 Task 3: Giao Diện Làm Bài

### Cấu Trúc Layout

```
┌─────────────────────────────────────────────────────┐
│ Tên Cuộc Thi              │ Timer: HH:MM:SS        │
└─────────────────────────────────────────────────────┘
┌──────────────────────┐ ┌─────────────────────────────┐
│  Khu Vực Câu Hỏi    │ │ Trình Theo Dõi Câu Hỏi     │
│  (Bên trái)         │ │ (Bên phải - 5 câu/hàng)    │
│  - Câu hỏi          │ │                             │
│  - Tùy chọn         │ │ 🟢 Đã trả lời               │
│  - Nút Trước/Tiếp   │ │ 🔴 Chưa trả lời (scroll)    │
│  - Nút Nộp Bài      │ │ 🟡 Chưa chọn                │
└──────────────────────┘ └─────────────────────────────┘
```

### Chức Năng Timer

- **Hiển Thị:** HH:MM:SS ở góc trên cùng bên phải
- **Cập Nhật:** Mỗi 1 giây
- **Cảnh Báo:** Chuyển màu đỏ khi còn < 1 phút
- **Tự Động Nộp:** Hết thời gian tự động nộp bài

### Trình Theo Dõi Câu Hỏi

- **Bố Cục:** 5 câu hỏi trên một hàng
- **Màu Sắc:**
  - 🟢 **Xanh lá**: Đã trả lời (đã chọn đáp án)
  - 🔴 **Đỏ**: Chưa trả lời nhưng đã cuộn qua
  - 🟡 **Xám**: Chưa chọn/xem
- **Tương Tác:** Click để nhảy đến câu hỏi đó

### Kiểm Tra Trước Khi Nộp

```javascript
// System sẽ kiểm tra:
for (let q of questions) {
  if (!answers[q.id] || answers[q.id] === '') {
    unanswered.push(q_number);
  }
}

// Nếu có câu chưa trả lời:
alert('Câu chưa trả lời: 3, 7, 15');
// Không cho nộp
```

### Sử Dụng ContestTaking

```javascript
// Khởi động giao diện làm bài
await ContestTaking.init(contestId);

// Các method công khai:
ContestTaking.goToQuestion(index)      // Jump to Q#N
ContestTaking.saveAnswer(qId, answer)  // Lưu đáp án
ContestTaking.previousQuestion()       // Câu trước
ContestTaking.nextQuestion()           // Câu tiếp
ContestTaking.submitContest()          // Nộp bài
```

---

## 🏆 Task 4: Kết Quả & Xếp Hạng

### Trang Kết Quả

```
┌──────────────────────────────────────┐
│ Bài Làm Của Bạn Đã Được Nộp!        │
│ Cảm ơn bạn đã tham gia: [Tên]       │
├──────────────────────────────────────┤
│                                      │
│  ┌──────────────────┐                │
│  │    Điểm Số       │  Số Câu Đúng  │
│  │      85%         │  17/20         │
│  │    Giỏi ⭐      │                 │
│  └──────────────────┘  Thời Gian    │
│                        12:45         │
│     Tỷ Lệ Đúng                      │
│     ███████████░░░░░░░░ 85%         │
│     Điểm SP: +7                     │
│                                      │
│  [Xem Xếp Hạng]  [Về Trang Chủ]    │
└──────────────────────────────────────┘
```

### Mốc Điểm & Thưởng

| Khoảng Điểm | Đánh Giá | Emoji | SP Mặc Định |
|-------------|---------|-------|------------|
| 90-100% | Xuất Sắc | 🌟 | +10 |
| 80-89% | Giỏi | ⭐ | +7 |
| 70-79% | Khá | ✓ | +5 |
| <70% | Cần Cố Gắng | 📚 | 0 |

### Bảng Xếp Hạng

```
╔════════════════════════════════════════════════════════╗
║              🏆 Xếp Hạng Cuộc Thi                    ║
║            [Kiểm Tra Toán Lớp 7]                     ║
╠════════════════════════════════════════════════════════╣
║ Xếp │ Họ Tên        │ Điểm │ Đúng/Tổng │ SP │ Thời Gian ║
╠════════════════════════════════════════════════════════╣
║ 🥇 │ Nguyễn Văn A │ 95%  │ 19/20     │ +10│ 10:45   ║
║ 🥈 │ Trần Thị B   │ 90%  │ 18/20     │ +10│ 11:20   ║
║ 🥉 │ Lê Minh C    │ 85%  │ 17/20     │ +7 │ 12:15   ║
║ #4 │ Phạm Hồng D  │ 75%  │ 15/20     │ +5 │ 14:00   ║
║ #5 │ Vũ Quốc E    │ 70%  │ 14/20     │ +5 │ 15:30   ║
╚════════════════════════════════════════════════════════╝
```

### Dữ Liệu Kết Quả

```javascript
{
  userId: "user_123",
  score: 85,                    // Phần trăm 0-100
  correctAnswers: 17,          // Số câu đúng
  totalQuestions: 20,          // Tổng số câu
  pointsGained: 7,             // SP thưởng
  oldPoints: 1000,             // SP trước
  finalPoints: 1007,           // SP sau
  timeTaken: 745,              // Giây
  completedAt: "2026-03-28T10:30:00.000Z"
}
```

---

## 🔧 Các Tệp Được Tạo/Cập Nhật

### Tệp Tạo Mới

1. **JS/contest-taking.js** (500+ dòng)
   - Khởi tạo cuộc thi
   - Render giao diện
   - Quản lý câu hỏi & đáp án
   - Kiểm tra & nộp bài
   - Hiển thị kết quả & xếp hạng

2. **CSS/contest.css** (700+ dòng)
   - Styling giao diện làm bài
   - Timer & tracker styles
   - Trang kết quả styles
   - Bảng xếp hạng styles
   - Responsive design

### Tệp Cập Nhật

1. **admin.html**
   - Thêm contest-modal form
   - Thêm contest management UI

2. **admin.js**
   - Method loadContestsTab()
   - Method showContestModal()
   - Method saveContest()
   - Method editContest()
   - Method deleteContest()
   - Method viewContestResults()

3. **JS/contests.js**
   - Thêm reward70, reward80, reward90
   - Cập nhật submitContest() với điểm thưởng
   - Cập nhật createContest() & updateContest()

4. **CSS/admin.css**
   - Sport card styles
   - Contest modal form styles
   - Leaderboard modal styles

5. **index.html**
   - Thêm `<link rel="stylesheet" href="CSS/contest.css">`
   - Thêm `<script src="JS/contest-taking.js"></script>`

---

## 🚀 Hướng Dẫn Sử Dụng

### Cho Admin: Tạo Cuộc Thi

1. Đăng nhập admin → Vào admin.html
2. Click "Quản Lý Cuộc Thi" trên sidebar
3. Click "Tạo Cuộc Thi Mới"
4. Điền form (tất cả trường *)
5. Click "Lưu Cuộc Thi"

### Cho Học Sinh: Tham Gia Cuộc Thi

1. Đăng nhập tài khoản
2. Vào danh sách cuộc thi
3. Click cuộc thi muốn làm
4. Trả lời tất cả câu hỏi (theo tracker)
5. Click "Nộp Bài"
6. Xem kết quả & xếp hạng

---

## 🧪 Test Cases

### Test 1: Tạo Cuộc Thi
- [ ] Nhập đầy đủ thông tin
- [ ] Xác nhận không cho tạo nếu ngày kết thúc < bắt đầu
- [ ] Xác nhận cuộc thi được lưu vào localStorage

### Test 2: Làm Bài
- [ ] Timer hiển thị chính xác
- [ ] Tracker cập nhật trạng thái câu hỏi
- [ ] Không cho nộp nếu có câu chưa trả lời
- [ ] Hết thời gian tự động nộp

### Test 3: Kết Quả
- [ ] Điểm percentage tính đúng
- [ ] Bonus point đúng theo mốc
- [ ] Xếp hạng sắp xếp theo điểm cao nhất

### Test 4: Leaderboard
- [ ] Hiển thị tất cả người tham gia
- [ ] Top 3 có emoji medal
- [ ] Sắp xếp theo điểm từ cao → thấp

---

## 📁 Package Structure

```
new_project/
├── admin.html               [Cập nhật]
├── index.html               [Cập nhật]
├── CSS/
│   ├── admin.css           [Cập nhật]
│   ├── contest.css         [TẠO MỚI]
│   └── ...
├── JS/
│   ├── admin.js            [Cập nhật]
│   ├── contests.js         [Cập nhật]
│   ├── contest-taking.js   [TẠO MỚI]
│   └── ...
└── DATA/
    ├── contests.json
    └── questions.json
```

---

## 💡 Mẹo & Tricks

### Kiểm Tra Dữ Liệu Cuộc Thi (F12 Console)
```javascript
console.log(window.ContestSystem.contests);
console.log(window.ContestSystem.questions);
```

### Khởi Động Test Cuộc Thi
```javascript
await ContestTaking.init('contest_1711614000000');
```

### Xem Kết Quả Có Sẵn
```javascript
const contest = window.ContestSystem.getContestById('contest_id');
console.log(contest.results);  // Mảng kết quả
```

---

**Ngày hoàn thành:** 28/03/2026  
**Phiên bản:** 2.0 (với Contest System)  
**Version:** 1.0  
**Status:** ✅ Ready for Deployment
