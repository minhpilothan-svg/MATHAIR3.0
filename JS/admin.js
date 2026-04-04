// MathAir Admin Page - Main Logic
// ===========================================================

const AdminPageUI = {
    currentUser: null,
    selectedUserId: null,
    allUsers: [],

    /**
     * Initialize admin page
     */
    async init() {
        try {
            console.log('AdminPageUI: Initializing...');
            
            // Check if user is authenticated and has admin access
            await this.checkAuthorization();
            console.log('AdminPageUI: Authorization passed');
            
            // Load user data
            await this.loadAdminData();
            console.log('AdminPageUI: Data loaded, users count:', this.allUsers.length);
            
            // Render admin info
            this.renderAdminInfo();
            console.log('AdminPageUI: Admin info rendered');
            
            // Attach event listeners
            this.attachEventListeners();
            console.log('AdminPageUI: Event listeners attached');
            
            // Load dashboard by default
            await this.loadTab('dashboard');
            console.log('AdminPageUI: Dashboard loaded successfully');
        } catch (error) {
            console.error('AdminPageUI initialization error:', error);
            const contentArea = document.getElementById('admin-content');
            if (contentArea) {
                contentArea.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-triangle"></i> Lỗi: ${error.message}</div>`;
            }
        }
    },

    /**
     * Check if user is authorized to view admin page
     */
    async checkAuthorization() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 100; // 10 second timeout (100 * 100ms)
            
            const checkAuth = setInterval(() => {
                attempts++;
                console.log(`Auth check attempt ${attempts}/${maxAttempts}: RoleManager=${!!window.RoleManager}, firebaseAuth=${!!window.firebaseAuth}`);
                
                if (attempts > maxAttempts) {
                    clearInterval(checkAuth);
                    console.error('Timeout waiting for authentication initialization');
                    // Still proceed - don't block on auth if it takes too long
                    resolve(true);
                    return;
                }
                
                if (window.RoleManager && window.firebaseAuth) {
                    clearInterval(checkAuth);
                    console.log('Auth components ready, checking user...');
                    
                    window.firebaseAuth.onAuthStateChanged((firebaseUser) => {
                        if (!firebaseUser) {
                            console.log('User not logged in, redirecting...');
                            alert('Bạn cần đăng nhập để truy cập trang này!');
                            setTimeout(() => window.location.href = 'index.html', 100);
                            return;
                        }
                        
                        // Check if user is admin or reviewer (both have admin access)
                        const currentRole = window.Auth?.getCurrentUser()?.role || firebaseUser.customClaims?.role || 'user';
                        console.log('Current user role:', currentRole);
                        
                        if (!window.RoleManager.canAccessAdmin()) {
                            console.log('User does not have admin access');
                            alert('Bạn không có quyền truy cập trang này!');
                            setTimeout(() => window.location.href = 'index.html', 100);
                            return;
                        }
                        
                        this.currentUser = window.Auth?.getCurrentUser() || { 
                            uid: firebaseUser.uid,
                            email: firebaseUser.email 
                        };
                        console.log('User authorized:', this.currentUser);
                        resolve(true);
                    });
                }
            }, 100);
        });
    },

    /**
     * Load admin data from Firestore
     */
    async loadAdminData() {
        return new Promise(async (resolve, reject) => {
            // Set a timeout of 5 seconds
            const timeout = setTimeout(() => {
                console.warn('Admin data loading timeout - using empty array');
                this.allUsers = [];
                resolve();
            }, 5000);

            try {
                const usersSnap = await window.firebaseDb.collection('users').get();
                clearTimeout(timeout);
                this.allUsers = [];
                
                usersSnap.forEach(doc => {
                    this.allUsers.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                console.log('Admin data loaded:', this.allUsers.length, 'users');
                resolve();
            } catch (error) {
                clearTimeout(timeout);
                console.error('Error loading admin data:', error);
                // If Firestore fails, initialize with empty array and continue
                this.allUsers = [];
                resolve();
            }
        });
    },

    /**
     * Render admin info in sidebar
     */
    renderAdminInfo() {
        const user = this.currentUser;
        const adminNameEl = document.getElementById('admin-name');
        const adminRoleEl = document.getElementById('admin-role');
        const avatarEl = document.getElementById('admin-avatar');
        
        if (adminNameEl) {
            adminNameEl.textContent = user.username || user.email || 'Admin';
        }
        
        if (adminRoleEl) {
            const roleConfig = window.RoleManager?.ROLES?.[user.role];
            adminRoleEl.textContent = roleConfig?.name || 'Người Dùng';
        }
        
        if (avatarEl) {
            if (user.avatar) {
                avatarEl.src = user.avatar;
            } else {
                avatarEl.src = 'https://via.placeholder.com/150';
            }
        }
    },

    /**
     * Load tab content
     */
    async loadTab(tabName) {
        const contentArea = document.getElementById('admin-content');
        const pageTitle = document.getElementById('page-title');
        
        // Update page title
        const titleMap = {
            'dashboard': 'Dashboard',
            'contests': 'Quản Lý Cuộc Thi',
            'users': 'Quản Lý Người Dùng',
            'roles': 'Quản Lý Vai Trò',
            'analytics': 'Thống Kê',
            'settings': 'Cài Đặt'
        };
        pageTitle.textContent = titleMap[tabName] || 'Dashboard';
        
        // Clear content
        contentArea.innerHTML = '<div class="loading"><p>Đang tải...</p></div>';
        
        switch (tabName) {
            case 'dashboard':
                await this.loadDashboard(contentArea);
                break;
            case 'contests':
                await this.loadContestsTab(contentArea);
                break;
            case 'users':
                await this.loadUsersTab(contentArea);
                break;
            case 'roles':
                await this.loadRolesTab(contentArea);
                break;
            case 'analytics':
                await this.loadAnalyticsTab(contentArea);
                break;
            case 'settings':
                await this.loadSettingsTab(contentArea);
                break;
            default:
                contentArea.innerHTML = '<p>Tab không tồn tại</p>';
        }
        
        // Update active sidebar link
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    },

    /**
     * Load dashboard
     */
    async loadDashboard(contentArea) {
        try {
            let adminCount = 0, reviewerCount = 0, userCount = 0;
            
            this.allUsers.forEach(user => {
                const role = user.role || 'user';
                if (role === 'admin') adminCount++;
                else if (role === 'reviewer') reviewerCount++;
                else userCount++;
            });

            contentArea.innerHTML = `
                <div class="admin-section">
                    <h2>Tổng Quan Hệ Thống</h2>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="stat-content">
                                <p class="stat-label">Tổng Người Dùng</p>
                                <p class="stat-value">${this.allUsers.length}</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon admin-icon">
                                <i class="fas fa-crown"></i>
                            </div>
                            <div class="stat-content">
                                <p class="stat-label">Quản Trị Viên</p>
                                <p class="stat-value">${adminCount}</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon reviewer-icon">
                                <i class="fas fa-check"></i>
                            </div>
                            <div class="stat-content">
                                <p class="stat-label">Người Chấm Chữa</p>
                                <p class="stat-value">${reviewerCount}</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon user-icon">
                                <i class="fas fa-user"></i>
                            </div>
                            <div class="stat-content">
                                <p class="stat-label">Người Dùng Thường</p>
                                <p class="stat-value">${userCount}</p>
                            </div>
                        </div>
                    </div>

                    <div class="dashboard-actions">
                        <h3>Hành Động Nhanh</h3>
                        <div class="action-buttons">
                            <button class="btn btn-primary" onclick="AdminPageUI.loadTab('contests')">
                                <i class="fas fa-pencil-alt"></i> Quản Lý Cuộc Thi
                            </button>
                            <button class="btn btn-primary" onclick="AdminPageUI.loadTab('users')">
                                <i class="fas fa-user-edit"></i> Quản Lý Người Dùng
                            </button>
                            <button class="btn btn-primary" onclick="AdminPageUI.loadTab('roles')">
                                <i class="fas fa-shield-alt"></i> Quản Lý Vai Trò
                            </button>
                            <button class="btn btn-primary" onclick="AdminPageUI.loadTab('analytics')">
                                <i class="fas fa-chart-pie"></i> Xem Thống Kê
                            </button>
                        </div>
                    </div>

                    <div class="recent-users">
                        <h3>10 Người Dùng Mới Nhất</h3>
                        <div class="users-list-compact">
                            ${this.allUsers
                                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                .slice(0, 10)
                                .map(user => `
                                    <div class="user-list-item">
                                        <img src="${user.avatar || 'https://via.placeholder.com/40'}" alt="Avatar" class="user-avatar-sm">
                                        <div class="user-info-compact">
                                            <p class="user-name">${user.username || user.email}</p>
                                            <p class="user-email">${user.email}</p>
                                        </div>
                                        <span class="role-badge role-${user.role || 'user'}">
                                            ${window.RoleManager.ROLES[user.role || 'user']?.name || 'User'}
                                        </span>
                                    </div>
                                `)
                                .join('')}
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading dashboard:', error);
            contentArea.innerHTML = `<p class="error-message">Lỗi: ${error.message}</p>`;
        }
    },

    /**
     * Load contests management tab
     */
    async loadContestsTab(contentArea) {
        try {
            // Initialize contest system if not already done
            if (!window.ContestSystem) {
                contentArea.innerHTML = `<p class="error-message">Hệ thống cuộc thi chưa được khởi tạo</p>`;
                return;
            }

            await window.ContestSystem.init();
            const contests = window.ContestSystem.contests || [];

            let contestsHTML = `
                <div class="admin-section">
                    <div class="section-header">
                        <div>
                            <h2>Quản Lý Cuộc Thi</h2>
                            <p class="section-subtitle">Tạo và quản lý các cuộc thi cho học sinh</p>
                        </div>
                        <button class="btn btn-primary" onclick="AdminPageUI.showContestModal()">
                            <i class="fas fa-plus"></i> Tạo Cuộc Thi Mới
                        </button>
                    </div>

                    <div class="contests-list">
            `;

            if (contests.length === 0) {
                contestsHTML += `
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>Chưa có cuộc thi nào</p>
                        <button class="btn btn-primary" onclick="AdminPageUI.showContestModal()">
                            <i class="fas fa-plus"></i> Tạo Cuộc Thi Đầu Tiên
                        </button>
                    </div>
                `;
            } else {
                contests.forEach(contest => {
                    const startDate = new Date(contest.startTime).toLocaleString('vi-VN');
                    const endDate = new Date(contest.endTime).toLocaleString('vi-VN');
                    const participantsCount = contest.participants ? contest.participants.length : 0;
                    
                    contestsHTML += `
                        <div class="contest-card">
                            <div class="contest-header">
                                <h3>${contest.title}</h3>
                                <span class="contest-status status-${contest.status}">${contest.status}</span>
                            </div>
                            <p class="contest-description">${contest.description}</p>
                            <div class="contest-meta">
                                <div class="meta-item">
                                    <i class="fas fa-clock"></i> ${contest.duration} phút
                                </div>
                                <div class="meta-item">
                                    <i class="fas fa-question-circle"></i> ${contest.totalQuestions} câu
                                </div>
                                <div class="meta-item">
                                    <i class="fas fa-users"></i> ${participantsCount} tham gia
                                </div>
                            </div>
                            <div class="contest-times">
                                <p><strong>Bắt đầu:</strong> ${startDate}</p>
                                <p><strong>Kết thúc:</strong> ${endDate}</p>
                            </div>
                            <div class="contest-actions">
                                <button class="btn btn-sm btn-secondary" onclick="AdminPageUI.editContest('${contest.id}')">
                                    <i class="fas fa-edit"></i> Chỉnh Sửa
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="AdminPageUI.viewContestResults('${contest.id}')">
                                    <i class="fas fa-chart-bar"></i> Xem Kết Quả
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="AdminPageUI.deleteContest('${contest.id}')">
                                    <i class="fas fa-trash"></i> Xóa
                                </button>
                            </div>
                        </div>
                    `;
                });
            }

            contestsHTML += `
                    </div>
                </div>
            `;

            contentArea.innerHTML = contestsHTML;
        } catch (error) {
            console.error('Error loading contests tab:', error);
            contentArea.innerHTML = `<p class="error-message">Lỗi: ${error.message}</p>`;
        }
    },

    /**
     * Load users management tab
     */
    async loadUsersTab(contentArea) {
        try {
            let tableHTML = `
                <div class="admin-section">
                    <h2>Quản Lý Người Dùng</h2>
                    <div class="users-table-wrapper">
                        <table class="users-table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Vai Trò</th>
                                    <th>Ngày Tạo</th>
                                    <th>Hành Động</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            this.allUsers.forEach(user => {
                const role = user.role || 'user';
                const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A';
                
                tableHTML += `
                    <tr>
                        <td><strong>${user.username || user.email}</strong></td>
                        <td>${user.email}</td>
                        <td>
                            <span class="role-badge role-${role}">
                                ${window.RoleManager.ROLES[role]?.name || 'Unknown'}
                            </span>
                        </td>
                        <td>${createdAt}</td>
                        <td>
                            <button class="btn btn-sm btn-secondary" onclick="AdminPageUI.openRoleDialog('${user.id}', '${user.email}')">
                                <i class="fas fa-edit"></i> Đổi Role
                            </button>
                        </td>
                    </tr>
                `;
            });

            tableHTML += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            contentArea.innerHTML = tableHTML;
        } catch (error) {
            console.error('Error loading users tab:', error);
            contentArea.innerHTML = `<p class="error-message">Lỗi: ${error.message}</p>`;
        }
    },

    /**
     * Load roles management tab
     */
    async loadRolesTab(contentArea) {
        const roles = window.RoleManager.getAllRoles();
        
        let rolesHTML = `
            <div class="admin-section">
                <h2>Quản Lý Vai Trò</h2>
                <div class="roles-grid">
        `;

        Object.entries(roles).forEach(([roleId, roleConfig]) => {
            rolesHTML += `
                <div class="role-card">
                    <div class="role-card-header">
                        <h3>${roleConfig.name}</h3>
                        <span class="role-id">(${roleId})</span>
                    </div>
                    <div class="role-card-body">
                        <p><strong>Quyền Hạn:</strong></p>
                        <ul class="permissions-list">
            `;
            
            if (roleConfig.permissions.includes('*')) {
                rolesHTML += `<li>✓ Tất cả quyền</li>`;
            } else {
                roleConfig.permissions.forEach(perm => {
                    rolesHTML += `<li>✓ ${perm}</li>`;
                });
            }
            
            rolesHTML += `
                        </ul>
                        <div class="role-access">
                            <p>
                                <strong>Truy Cập Admin:</strong> 
                                ${roleConfig.canAccessAdmin ? '<span style="color: #22C55E;">✓ Có</span>' : '<span style="color: #E33535;">✗ Không</span>'}
                            </p>
                        </div>
                    </div>
                </div>
            `;
        });

        rolesHTML += `
                </div>
            </div>
        `;

        contentArea.innerHTML = rolesHTML;
    },

    /**
     * Load analytics tab
     */
    async loadAnalyticsTab(contentArea) {
        contentArea.innerHTML = `
            <div class="admin-section">
                <h2>Thống Kê Hệ Thống</h2>
                <div class="analytics-placeholder">
                    <i class="fas fa-chart-bar"></i>
                    <p>Chức năng thống kê sẽ được cập nhật</p>
                    <ul>
                        <li>📊 Biểu đồ hoạt động người dùng</li>
                        <li>📈 Tiến độ học tập theo khối lớp</li>
                        <li>🏆 Xếp hạng cuộc thi</li>
                        <li>⚠️ Cảnh báo hệ thống</li>
                    </ul>
                </div>
            </div>
        `;
    },

    /**
     * Load settings tab
     */
    async loadSettingsTab(contentArea) {
        contentArea.innerHTML = `
            <div class="admin-section">
                <h2>Cài Đặt Hệ Thống</h2>
                <div class="settings-content">
                    <h3>Cài Đặt Chung</h3>
                    <div class="settings-group">
                        <label>Tên Ứng Dụng</label>
                        <input type="text" value="MathAir" readonly class="settings-input">
                    </div>
                    <div class="settings-group">
                        <label>Phiên Bản</label>
                        <input type="text" value="1.0.0" readonly class="settings-input">
                    </div>
                    <div class="settings-group">
                        <label>Ngôn Ngữ</label>
                        <select class="settings-input">
                            <option selected>Tiếng Việt</option>
                            <option>English</option>
                            <option>中文</option>
                        </select>
                    </div>

                    <h3 style="margin-top: 30px;">Cài Đặt Nâng Cao</h3>
                    <div class="settings-group">
                        <label>
                            <input type="checkbox" checked> Bảo vệ dữ liệu người dùng
                        </label>
                    </div>
                    <div class="settings-group">
                        <label>
                            <input type="checkbox" checked> Ghi nhật ký hoạt động admin
                        </label>
                    </div>

                    <div class="settings-actions">
                        <button class="btn btn-primary">Lưu Cài Đặt</button>
                        <button class="btn btn-secondary">Đặt Lại Mặc Định</button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Open role change dialog
     */
    openRoleDialog(userId, userEmail) {
        this.selectedUserId = userId;
        
        const dialog = document.getElementById('role-dialog');
        const infoText = document.getElementById('role-dialog-user-info');
        
        infoText.textContent = `Thay đổi vai trò cho: ${userEmail}`;
        dialog.style.display = 'block';
    },

    /**
     * Close role dialog
     */
    closeRoleDialog() {
        document.getElementById('role-dialog').style.display = 'none';
        this.selectedUserId = null;
    },

    /**
     * Show contest creation modal
     */
    showContestModal(contestId = null) {
        const modal = document.getElementById('contest-modal');
        const title = document.getElementById('contest-modal-title');
        
        // Reset form
        document.getElementById('contest-form').reset();
        
        if (contestId) {
            // Edit mode
            title.textContent = 'Chỉnh Sửa Cuộc Thi';
            const contest = window.ContestSystem.getContestById(contestId);
            if (contest) {
                document.getElementById('contest-title').value = contest.title;
                document.getElementById('contest-description').value = contest.description;
                document.getElementById('contest-start-time').value = new Date(contest.startTime).toISOString().slice(0, 16);
                document.getElementById('contest-end-time').value = new Date(contest.endTime).toISOString().slice(0, 16);
                document.getElementById('contest-duration').value = contest.duration;
                document.getElementById('contest-total-questions').value = contest.totalQuestions;
                document.getElementById('contest-question-source').value = contest.questionSource || 'random';
                document.getElementById('contest-reward-70').value = contest.reward70 || 5;
                document.getElementById('contest-reward-80').value = contest.reward80 || 7;
                document.getElementById('contest-reward-90').value = contest.reward90 || 10;
                this.currentContestId = contestId;
            }
        } else {
            // Create mode
            title.textContent = 'Tạo Cuộc Thi Mới';
            this.currentContestId = null;
        }
        
        modal.style.display = 'flex';
    },

    /**
     * Close contest modal
     */
    closeContestModal() {
        document.getElementById('contest-modal').style.display = 'none';
        this.currentContestId = null;
    },

    /**
     * Save contest (create or update)
     */
    async saveContest() {
        const form = document.getElementById('contest-form');
        if (!form.checkValidity()) {
            alert('Vui lòng điền đầy đủ tất cả các trường được đánh dấu *');
            return;
        }

        const contestData = {
            title: document.getElementById('contest-title').value,
            description: document.getElementById('contest-description').value,
            startTime: document.getElementById('contest-start-time').value,
            endTime: document.getElementById('contest-end-time').value,
            duration: parseInt(document.getElementById('contest-duration').value),
            totalQuestions: parseInt(document.getElementById('contest-total-questions').value),
            questionSource: document.getElementById('contest-question-source').value,
            reward70: parseInt(document.getElementById('contest-reward-70').value),
            reward80: parseInt(document.getElementById('contest-reward-80').value),
            reward90: parseInt(document.getElementById('contest-reward-90').value)
        };

        try {
            let result;
            if (this.currentContestId) {
                result = window.ContestSystem.updateContest(this.currentContestId, contestData);
            } else {
                result = window.ContestSystem.createContest(contestData);
            }

            if (result.success) {
                alert(result.message);
                this.closeContestModal();
                await this.loadTab('contests');
            } else {
                alert('Lỗi: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving contest:', error);
            alert('Lỗi: ' + error.message);
        }
    },

    /**
     * Edit contest
     */
    editContest(contestId) {
        this.showContestModal(contestId);
    },

    /**
     * Delete contest
     */
    async deleteContest(contestId) {
        if (confirm('Bạn có chắc muốn xóa cuộc thi này?')) {
            try {
                const result = window.ContestSystem.deleteContest(contestId);
                if (result.success) {
                    alert(result.message);
                    await this.loadTab('contests');
                } else {
                    alert('Lỗi: ' + result.message);
                }
            } catch (error) {
                console.error('Error deleting contest:', error);
                alert('Lỗi: ' + error.message);
            }
        }
    },

    /**
     * View contest results (leaderboard)
     */
    async viewContestResults(contestId) {
        const contest = window.ContestSystem.getContestById(contestId);
        if (!contest) {
            alert('Cuộc thi không tồn tại');
            return;
        }

        try {
            const results = contest.results || [];
            const users = this.allUsers;

            // Sort results by score (descending)
            const sortedResults = results.sort((a, b) => b.score - a.score);

            let leaderboardHTML = `
                <div class="leaderboard-modal">
                    <div class="modal-header">
                        <h2>Kết Quả Cuộc Thi: ${contest.title}</h2>
                        <button class="modal-close" onclick="AdminPageUI.closeLeaderboard()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <table class="leaderboard-table">
                            <thead>
                                <tr>
                                    <th>Xếp Hạng</th>
                                    <th>Học Sinh</th>
                                    <th>Điểm (%)</th>
                                    <th>Đúng/Tổng</th>
                                    <th>Điểm SP</th>
                                    <th>Thời Gian</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            sortedResults.forEach((result, index) => {
                const user = users.find(u => u.id === result.userId);
                const userName = user ? (user.username || user.email) : 'Unknown';
                const completedTime = result.completedAt ? new Date(result.completedAt).toLocaleString('vi-VN') : 'N/A';
                const pointsGained = result.pointsGained || 0;

                leaderboardHTML += `
                    <tr>
                        <td><strong>#${index + 1}</strong></td>
                        <td>${userName}</td>
                        <td><strong>${result.score}%</strong></td>
                        <td>${result.correctAnswers}/${result.totalQuestions}</td>
                        <td><span class="badge-sp">+${pointsGained}</span></td>
                        <td>${completedTime}</td>
                    </tr>
                `;
            });

            leaderboardHTML += `
                            </tbody>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="AdminPageUI.closeLeaderboard()">Đóng</button>
                    </div>
                </div>
            `;

            // Display as a modal overlay
            const leaderboardModal = document.createElement('div');
            leaderboardModal.id = 'leaderboard-modal';
            leaderboardModal.className = 'modal-overlay-full';
            leaderboardModal.innerHTML = leaderboardHTML;
            document.body.appendChild(leaderboardModal);
        } catch (error) {
            console.error('Error viewing contest results:', error);
            alert('Lỗi: ' + error.message);
        }
    },

    /**
     * Close leaderboard
     */
    closeLeaderboard() {
        const modal = document.getElementById('leaderboard-modal');
        if (modal) {
            modal.remove();
        }
    },

    /**
     * Confirm and execute role change
     */
    async confirmChangeRole() {
        if (!this.selectedUserId) return;
        
        const newRole = document.getElementById('role-select').value;
        
        try {
            const result = await window.RoleManager.updateUserRole(this.selectedUserId, newRole);
            
            alert(result.message);
            
            if (result.success) {
                // Reload users tab
                await this.loadAdminData();
                await this.loadTab('users');
                this.closeRoleDialog();
            }
        } catch (error) {
            console.error('Error changing role:', error);
            alert('Lỗi: ' + error.message);
        }
    },

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Sidebar tab switching
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = e.currentTarget.getAttribute('data-tab');
                this.loadTab(tabName);
                this.closeSidebar();
            });
        });

        // Hamburger menu
        const hamburgerBtn = document.getElementById('hamburger-btn');
        if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Mobile sidebar close
        const sidebarToggleMobile = document.getElementById('sidebar-toggle-mobile');
        if (sidebarToggleMobile) {
            sidebarToggleMobile.addEventListener('click', () => {
                this.closeSidebar();
            });
        }

        // Back button
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-admin-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                if (confirm('Bạn có chắc muốn đăng xuất?')) {
                    await window.Auth.logout();
                }
            });
        }

        // Role dialog overlay click
        const roleDialog = document.getElementById('role-dialog');
        const dialogOverlay = document.querySelector('.dialog-overlay');
        if (dialogOverlay) {
            dialogOverlay.addEventListener('click', () => {
                this.closeRoleDialog();
            });
        }
    },

    /**
     * Toggle sidebar visibility
     */
    toggleSidebar() {
        const sidebar = document.getElementById('admin-sidebar');
        sidebar.classList.toggle('open');
    },

    /**
     * Close sidebar
     */
    closeSidebar() {
        const sidebar = document.getElementById('admin-sidebar');
        sidebar.classList.remove('open');
    }
};

// Initialize admin page when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('=== DOMContentLoaded ===');
        console.log('Available globals:', {
            Auth: !!window.Auth,
            RoleManager: !!window.RoleManager,
            firebaseAuth: !!window.firebaseAuth,
            firebaseDb: !!window.firebaseDb,
            ContestSystem: !!window.ContestSystem,
            AdminPageUI: !!window.AdminPageUI
        });
        
        console.log('DOMContentLoaded: Initializing Auth first...');
        // Initialize Auth first
        if (window.Auth && window.Auth.init) {
            await window.Auth.init();
            console.log('Auth initialized. Current user:', window.Auth.currentUser);
        } else {
            console.warn('Auth or Auth.init not available');
        }
        
        // Then initialize Admin Page
        console.log('Now initializing AdminPageUI...');
        AdminPageUI.init();
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Lỗi khởi tạo: ' + error.message);
    }
});

// Make available globally
window.AdminPageUI = AdminPageUI;

// ============= LEGACY CODE (COMMENTED OUT - USING ADMINPAGEUI INSTEAD) =============
/*
const AdminApp = {
    state: {
        currentSection: 'dashboard',
        isDarkMode: localStorage.getItem('adminDarkMode') === 'true' || false,
        contests: [],
        students: [],
        eloRankings: [],
        reports: [],
        searchQuery: '',
        currentUser: {
            id: 'admin_001',
            name: 'Trần Quang Minh',
            email: 'admin@mathair.com',
            phone: '0912345678',
            joinedDate: '2024-01-01',
            role: 'Quản Trị Viên',
            avatar: 'ASSETS/images/avatars/nghenhin_xedoisong_mclaren-2.jpg',
            totalContests: 42,
            totalStudents: 250,
            totalReports: 15
        }
    },

    // Initialize
    init() {
        setupDarkMode();
        attachEventListeners();
        loadData();
        renderSection('dashboard');
    },

    // =============================================
    // DARK MODE
    // =============================================

    setupDarkMode() {
        if (state.isDarkMode) {
            document.body.classList.add('dark-mode');
            this.updateThemeIcon();
        }
        // Update admin name in sidebar
        document.getElementById('admin-profile-name').textContent = state.currentUser.name.split(' ')[state.currentUser.name.split(' ').length - 1];
    },

    toggleTheme() {
        state.isDarkMode = !state.isDarkMode;
        localStorage.setItem('adminDarkMode', state.isDarkMode);
        document.body.classList.toggle('dark-mode');
        this.updateThemeIcon();
    },

    updateThemeIcon() {
        const icon = document.getElementById('theme-toggle').querySelector('i');
        if (state.isDarkMode) {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    },

    // =============================================
    // EVENT LISTENERS
    // =============================================

    function attachEventListeners() {
        // Sidebar Navigation
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                navigateSection(section);
            });
        });

        // Sidebar Toggle (Mobile)
        document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);
        document.getElementById('sidebar-toggle-mobile').addEventListener('click', closeSidebar);

        // Theme Toggle
        document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

        // Settings Menu
        document.getElementById('settings-btn').addEventListener('click', toggleSettingsMenu);
        document.getElementById('logout-btn').addEventListener('click', logout);

        // Profile Button
        document.getElementById('profile-btn').addEventListener('click', openAdminProfileModal);

        // Profile Button
        document.getElementById('profile-btn').addEventListener('click', openAdminProfileModal);

        // Search
        document.getElementById('search-input').addEventListener('input', (e) => {
            state.searchQuery = e.target.value.toLowerCase();
            renderCurrentSection();
        });

        // Modal Close Buttons
        document.getElementById('contest-modal-close').addEventListener('click', closeContestModal);
        document.getElementById('contest-modal-cancel').addEventListener('click', closeContestModal);
        document.getElementById('user-action-modal-close').addEventListener('click', closeUserActionModal);
        document.getElementById('user-action-modal-cancel').addEventListener('click', closeUserActionModal);
        document.getElementById('report-details-modal-close').addEventListener('click', closeReportDetailsModal);
        document.getElementById('admin-profile-modal-close').addEventListener('click', closeAdminProfileModal);
        document.getElementById('student-profile-modal-close').addEventListener('click', closeStudentProfileModal);

        // Contest Form Submit
        document.getElementById('contest-form').addEventListener('submit', handleCreateContest);
        document.getElementById('user-action-form').addEventListener('submit', handleUserAction);

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.settings-menu')) {
                document.getElementById('settings-dropdown').classList.remove('active');
            }
        });
    }

    // =============================================
    // NAVIGATION
    // =============================================

    function navigateSection(section) {
        state.currentSection = section;
        renderSection(section);
        
        // Update sidebar active state
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === section) {
                link.classList.add('active');
            }
        });

        // Update section title
        const sectionTitles = {
            'dashboard': 'Dashboard',
            'contests': 'Tạo Cuộc Thi',
            'elo-ranking': 'Thống Kê ELO',
            'students': 'Quản Lý Học Viên',
            'reports': 'Báo Cáo & Ban'
        };
        document.getElementById('section-title').textContent = sectionTitles[section] || 'Dashboard';

        closeSidebar();
    }

    function renderSection(section) {
        const content = document.getElementById('admin-content');
        
        switch(section) {
            case 'dashboard':
                content.innerHTML = renderDashboard();
                break;
            case 'contests':
                content.innerHTML = renderContests();
                attachContestListeners();
                break;
            case 'elo-ranking':
                content.innerHTML = renderEloRanking();
                break;
            case 'students':
                content.innerHTML = renderStudents();
                attachStudentListeners();
                break;
            case 'reports':
                content.innerHTML = renderReports();
                attachReportListeners();
                break;
            default:
                content.innerHTML = renderDashboard();
        }
    }

    function renderCurrentSection() {
        renderSection(state.currentSection);
    }

    // =============================================
    // DATA LOADING
    // =============================================

    async function loadData() {
        try {
            console.log("📥 Bắt đầu tải dữ liệu từ Firestore...");
            
            // Load users từ Firestore
            if (window.loadUsersFromFirestore) {
                state.students = await window.loadUsersFromFirestore() || [];
                console.log(`✅ Tải được ${state.students.length} users từ Firestore`);
            } else {
                // Fallback: Load từ JSON nếu Firestore không khả dụng
                console.warn("⚠️ loadUsersFromFirestore không khả dụng, dùng JSON fallback");
                const usersRes = await fetch('DATA/users.json');
                const usersData = await usersRes.json();
                state.students = usersData.users || [];
            }

            // Load grades (vẫn từ JSON)
            const gradesRes = await fetch('DATA/grades.json');
            const gradesData = await gradesRes.json();
            state.grades = gradesData.grades || [];

            // Load contests từ Firestore hoặc fallback về ContestSystem
            if (window.loadContestsFromFirestore) {
                try {
                    const contests = await window.loadContestsFromFirestore();
                    if (contests && contests.length > 0) {
                        console.log(`✅ Tải được ${contests.length} cuộc thi từ Firestore`);
                        // Lưu vào ContestSystem
                        if (window.ContestSystem) {
                            window.ContestSystem.contests = contests;
                        }
                    } else {
                        console.warn("⚠️ Không có contests trong Firestore, dùng ContestSystem.init()");
                        await ContestSystem.init();
                    }
                } catch (e) {
                    console.error("❌ Lỗi tải contests từ Firestore, dùng fallback:", e);
                    await ContestSystem.init();
                }
            } else {
                // Fallback: Load contests from ContestSystem
                await ContestSystem.init();
            }

            initializeEloRankings();
            initializeContests();
            initializeReports();
        } catch (err) {
            console.error('Error loading data:', err);
        }
    }
    function initializeEloRankings() {
        // Build SP Rankings from actual user data
        state.eloRankings = state.students
            .filter(u => u.role === 'user')
            .map((student) => ({
                id: student.id,
                username: student.username,
                fullName: student.fullName,
                avatar: student.avatar,
                studyingPoints: student.studyingPoints || 1000,
                completedContests: (student.completedContests || []).length
            }))
            .sort((a, b) => b.studyingPoints - a.studyingPoints);
    }

    function initializeContests() {
        // Contests are loaded from ContestSystem.init()
        state.contests = ContestSystem.contests || [];
    }

    function initializeReports() {
        state.reports = [
            {
                id: 'report_001',
                reportedUser: {
                    id: 'user_001',
                    username: 'minhpilot',
                    fullName: 'Phan Hồng Minh'
                },
                reporter: {
                    id: 'user_002',
                    username: 'testuser'
                },
                reason: 'Spam và hành vi không lịch sự',
                date: '2024-12-20T10:30:00',
                status: 'pending'
            }
        ];
    }

    // =============================================
    // DASHBOARD
    // =============================================

    function renderDashboard() {
        const totalUsers = state.students.length;
        const totalContests = state.contests.length;
        const totalReports = state.reports.length;
        
        // Calculate active users from lastLogin date
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const activeUsers = state.students.filter(u => {
            const lastLogin = new Date(u.lastLogin || 0);
            return lastLogin > oneWeekAgo;
        }).length;
        
        // Count upcoming contests
        const upcomingContests = state.contests.filter(c => {
            const startTime = new Date(c.startTime);
            return startTime > now;
        }).length;

        return `
            <div class="dashboard">
                <div class="stat-card">
                    <div class="stat-card-icon primary">
                        <i class="fas fa-users"></i>
                    </div>
                    <p class="stat-card-title">Tổng Học Viên</p>
                    <p class="stat-card-value">${totalUsers}</p>
                    <p class="stat-card-change">↑ ${totalUsers - 2} người tham gia</p>
                </div>

                <div class="stat-card">
                    <div class="stat-card-icon success">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <p class="stat-card-title">Cuộc Thi</p>
                    <p class="stat-card-value">${totalContests}</p>
                    <p class="stat-card-change">${upcomingContests} cuộc thi sắp tới</p>
                </div>

                <div class="stat-card">
                    <div class="stat-card-icon warning">
                        <i class="fas fa-star"></i>
                    </div>
                    <p class="stat-card-title">Người Dùng Hoạt Động</p>
                    <p class="stat-card-value">${activeUsers}</p>
                    <p class="stat-card-change">${Math.round((activeUsers / totalUsers) * 100)}% tỉ lệ</p>
                </div>

                <div class="stat-card">
                    <div class="stat-card-icon danger">
                        <i class="fas fa-flag"></i>
                    </div>
                    <p class="stat-card-title">Báo Cáo Chờ Xử Lý</p>
                    <p class="stat-card-value">${totalReports}</p>
                    <p class="stat-card-change negative">Cần chú ý</p>
                </div>
            </div>

            <div class="table-container">
                <div class="table-header">
                    <h3>Hoạt Động Gần Đây</h3>
                </div>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Người Dùng</th>
                            <th>Hoạt Động</th>
                            <th>Thời Gian</th>
                            <th>Trạng Thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.students.slice(0, 5).map((student, idx) => `
                            <tr>
                                <td>
                                    <div class="user-cell">
                                        <img src="${student.avatar}" alt="${student.fullName}" class="user-avatar">
                                        <div>
                                            <p style="margin: 0; font-weight: 600;">${student.fullName}</p>
                                            <p style="margin: 0; font-size: 1.1rem; color: var(--admin-text-secondary);">@${student.username}</p>
                                        </div>
                                    </div>
                                </td>
                                <td>Hoàn thành bài tập</td>
                                <td>2 giờ trước</td>
                                <td><span class="status-badge active">Hoạt động</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // =============================================
    // CONTESTS
    // =============================================

    function renderContests() {
        const filtered = ContestSystem.contests.filter(c => 
            c.title.toLowerCase().includes(state.searchQuery)
        );

        return `
            <div class="table-container">
                <div class="table-header">
                    <h3>Danh Sách Cuộc Thi</h3>
                    <div class="table-header-actions">
                        <button class="btn-primary" id="btn-create-contest">
                            <i class="fas fa-plus"></i> Tạo Cuộc Thi
                        </button>
                    </div>
                </div>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Tên Cuộc Thi</th>
                            <th>Mô Tả</th>
                            <th>Câu Hỏi</th>
                            <th>Thời Gian</th>
                            <th>Người Tham Gia</th>
                            <th>Trạng Thái</th>
                            <th>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map(contest => {
                            const startTime = new Date(contest.startTime);
                            const endTime = new Date(contest.endTime);
                            const now = new Date();
                            let status = 'Sắp diễn ra';
                            let statusClass = 'pending';
                            
                            if (now >= startTime && now <= endTime) {
                                status = 'Đang diễn ra';
                                statusClass = 'active';
                            } else if (now > endTime) {
                                status = 'Đã kết thúc';
                                statusClass = 'completed';
                            }
                            
                            return `
                            <tr>
                                <td>
                                    <strong>${contest.title}</strong>
                                </td>
                                <td>
                                    <p style="margin: 0; font-size: 1.1rem; color: var(--admin-text-secondary); max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
                                        ${contest.description}
                                    </p>
                                </td>
                                <td><strong>${contest.totalQuestions}</strong> câu</td>
                                <td>
                                    <strong>${contest.duration}</strong> phút<br>
                                    <span style="font-size: 1rem; color: var(--admin-text-secondary);">
                                        ${startTime.toLocaleString('vi-VN')}
                                    </span>
                                </td>
                                <td><strong>${contest.participants.length}</strong> người</td>
                                <td>
                                    <span class="status-badge ${statusClass}">
                                        ${status}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn-primary btn-small" onclick="AdminApp.editContest('${contest.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-danger btn-small" onclick="AdminApp.deleteContest('${contest.id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function attachContestListeners() {
        document.getElementById('btn-create-contest').addEventListener('click', openContestModal);
    }

    function openContestModal(contestId = null) {
        const form = document.getElementById('contest-form');
        const modal = document.getElementById('contest-modal');
        const modalTitle = modal.querySelector('.modal-header h3');
        
        if (contestId) {
            // Edit mode
            const contest = ContestSystem.getContestById(contestId);
            if (!contest) {
                showNotification('Cuộc thi không tồn tại!', 'error');
                return;
            }
            
            // Check if contest has participants
            if (contest.participants && contest.participants.length > 0) {
                showNotification('Không thể chỉnh sửa cuộc thi đã có người tham gia!', 'error');
                return;
            }
            
            // Set modal title
            modalTitle.textContent = 'Chỉnh Sửa Cuộc Thi';
            
            // Pre-fill form with contest data
            form.title.value = contest.title;
            form.description.value = contest.description;
            form.startTime.value = new Date(contest.startTime).toISOString().slice(0, 16);
            form.endTime.value = new Date(contest.endTime).toISOString().slice(0, 16);
            form.duration.value = contest.duration;
            form.totalQuestions.value = contest.totalQuestions;
            
            // Store contest ID for update
            form.dataset.contestId = contestId;
            form.dataset.isEdit = 'true';
        } else {
            // Create mode
            modalTitle.textContent = 'Tạo Cuộc Thi Mới';
            form.reset();
            delete form.dataset.contestId;
            form.dataset.isEdit = 'false';
        }
        
        modal.style.display = 'flex';
    }

    function closeContestModal() {
        document.getElementById('contest-modal').style.display = 'none';
        document.getElementById('contest-form').reset();
    }

    function handleCreateContest(e) {
        e.preventDefault();
        const form = e.target;
        
        // Client-side date validation
        const startTime = new Date(form.startTime.value);
        const endTime = new Date(form.endTime.value);
        
        const errorDiv = document.getElementById('contest-form-error');
        
        // Check if end time is after start time
        if (endTime <= startTime) {
            errorDiv.style.display = 'block';
            errorDiv.style.color = '#f44336';
            errorDiv.textContent = 'Ngày kết thúc phải sau ngày bắt đầu!';
            return;
        }
        
        const contestData = {
            title: form.title.value,
            description: form.description.value,
            startTime: form.startTime.value,
            endTime: form.endTime.value,
            duration: form.duration.value,
            totalQuestions: form.totalQuestions.value,
            questionSource: form.questionSource.value || 'random'
        };
        
        const isEdit = form.dataset.isEdit === 'true';
        const contestId = form.dataset.contestId;
        
        let result;
        if (isEdit && contestId) {
            // Update existing contest
            result = ContestSystem.updateContest(contestId, contestData);
        } else {
            // Create new contest
            result = ContestSystem.createContest(contestData);
        }
        
        if (result.success) {
            errorDiv.style.display = 'none';
            closeContestModal();
            renderSection('contests');
            showNotification(result.message, 'success');
        } else {
            errorDiv.style.display = 'block';
            errorDiv.style.color = '#f44336';
            errorDiv.textContent = result.message;
        }
    }

    // =============================================
    // ELO RANKING
    // =============================================

    function renderEloRanking() {
        const filtered = state.eloRankings.filter(r =>
            r.fullName.toLowerCase().includes(state.searchQuery) ||
            r.username.toLowerCase().includes(state.searchQuery)
        );

        return `
            <div class="table-container">
                <div class="table-header">
                    <h3>Bảng Xếp Hạng Studying Points (SP)</h3>
                </div>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Hạng</th>
                            <th>Người Chơi</th>
                            <th>Studying Points</th>
                            <th>Cuộc Thi Hoàn Thành</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map((rank, idx) => {
                            return `
                                <tr>
                                    <td>
                                        <strong style="font-size: 1.6rem; color: var(--admin-primary);">
                                            ${idx + 1}
                                            ${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''}
                                        </strong>
                                    </td>
                                    <td>
                                        <div class="user-cell">
                                            <img src="${rank.avatar}" alt="${rank.fullName}" class="user-avatar">
                                            <div>
                                                <p style="margin: 0; font-weight: 600;">${rank.fullName}</p>
                                                <p style="margin: 0; font-size: 1.1rem; color: var(--admin-text-secondary);">@${rank.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <strong style="font-size: 1.5rem; color: var(--admin-primary);">${rank.studyingPoints}</strong>
                                    </td>
                                    <td><strong>${rank.completedContests}</strong></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // =============================================
    // STUDENTS
    // =============================================

    function renderStudents() {
        const filtered = state.students.filter(s =>
            s.fullName.toLowerCase().includes(state.searchQuery) ||
            s.username.toLowerCase().includes(state.searchQuery) ||
            s.email.toLowerCase().includes(state.searchQuery)
        );

        return `
            <div class="table-container">
                <div class="table-header">
                    <h3>Danh Sách Học Viên</h3>
                </div>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Tên Học Viên</th>
                            <th>Email</th>
                            <th>Trường</th>
                            <th>Lớp</th>
                            <th>Ngày Tham Gia</th>
                            <th>Trạng Thái</th>
                            <th>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map(student => {
                            const createdDate = new Date(student.createdAt).toLocaleDateString('vi-VN');
                            return `
                                <tr>
                                    <td>
                                        <div class="user-cell">
                                            <img src="${student.avatar}" alt="${student.fullName}" class="user-avatar">
                                            <div>
                                                <p style="margin: 0; font-weight: 600;">${student.fullName}</p>
                                                <p style="margin: 0; font-size: 1.1rem; color: var(--admin-text-secondary);">@${student.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>${student.email}</td>
                                    <td>${student.school}</td>
                                    <td>${student.grade}</td>
                                    <td>${createdDate}</td>
                                    <td><span class="status-badge active">Hoạt động</span></td>
                                    <td>
                                        <button class="btn-primary btn-small" onclick="AdminApp.openStudentProfileModal('${student.id}')">
                                            <i class="fas fa-user"></i>
                                        </button>
                                        <button class="btn-primary btn-small" onclick="AdminApp.openUserActionModal('${student.id}', '${student.fullName}')">
                                            <i class="fas fa-arrow-up"></i>
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function attachStudentListeners() {
        // Listeners will be attached dynamically through onclick attributes
    }

    // =============================================
    // REPORTS & BAN
    // =============================================

    function renderReports() {
        const filtered = state.reports.filter(r =>
            r.reportedUser.fullName.toLowerCase().includes(state.searchQuery) ||
            r.reason.toLowerCase().includes(state.searchQuery)
        );

        return `
            <div class="table-container">
                <div class="table-header">
                    <h3>Báo Cáo & Quản Lý Người Dùng</h3>
                </div>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Người Bị Báo Cáo</th>
                            <th>Người Báo Cáo</th>
                            <th>Lý Do</th>
                            <th>Ngày</th>
                            <th>Trạng Thái</th>
                            <th>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map(report => {
                            const reportDate = new Date(report.date).toLocaleDateString('vi-VN');
                            return `
                                <tr>
                                    <td>
                                        <strong>${report.reportedUser.fullName}</strong>
                                        <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem; color: var(--admin-text-secondary);">
                                            @${report.reportedUser.username}
                                        </p>
                                    </td>
                                    <td>
                                        <strong>@${report.reporter.username}</strong>
                                    </td>
                                    <td>${report.reason}</td>
                                    <td>${reportDate}</td>
                                    <td>
                                        <span class="status-badge ${report.status === 'pending' ? 'warning' : 'active'}">
                                            ${report.status === 'pending' ? 'Chờ xử lý' : 'Đã giải quyết'}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn-primary btn-small" onclick="AdminApp.openReportDetailsModal('${report.id}')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function attachReportListeners() {
        // Listeners will be attached dynamically through onclick attributes
    }

    function openUserActionModal(userId, userName, isBan = false) {
        const modal = document.getElementById('user-action-modal');
        const title = document.getElementById('user-action-title');
        const statusSelect = document.getElementById('user-action-status');
        
        title.textContent = isBan ? `Ban Người Dùng: ${userName}` : `Quản Lý Người Dùng: ${userName}`;
        document.getElementById('user-action-id').value = userId;
        
        if (isBan) {
            statusSelect.value = 'banned';
        }
        
        modal.style.display = 'flex';
    }

    function closeUserActionModal() {
        document.getElementById('user-action-modal').style.display = 'none';
        document.getElementById('user-action-form').reset();
    }

    function handleUserAction(e) {
        e.preventDefault();
        const userId = document.getElementById('user-action-id').value;
        const rank = document.getElementById('user-action-status').value;

        const student = state.students.find(s => s.id === userId);
        if (student) {
            student.rank = rank;
        }

        closeUserActionModal();
        renderCurrentSection();
        showNotification('Rank học viên đã được cập nhật thành công!', 'success');
    }

    function openReportDetailsModal(reportId) {
        const report = state.reports.find(r => r.id === reportId);
        if (!report) return;

        const modal = document.getElementById('report-details-modal');
        const body = document.getElementById('report-details-body');

        body.innerHTML = `
            <div style="margin-bottom: 2rem;">
                <div style="display: flex; align-items: center; margin-bottom: 1.5rem;">
                    <img src="${report.reportedUser.avatar}" alt="${report.reportedUser.fullName}" class="user-avatar" style="width: 4rem; height: 4rem; margin-right: 1rem;">
                    <div>
                        <p style="margin: 0; font-weight: 600; font-size: 1.4rem;">${report.reportedUser.fullName}</p>
                        <p style="margin: 0; color: var(--admin-text-secondary);">@${report.reportedUser.username}</p>
                    </div>
                </div>

                <div style="background: var(--admin-hover); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <p style="margin: 0 0 0.5rem 0; color: var(--admin-text-secondary); font-size: 1.1rem;">Lý do báo cáo:</p>
                    <p style="margin: 0; font-size: 1.3rem; line-height: 1.6;">"${report.reason}"</p>
                </div>

                <p style="color: var(--admin-text-secondary); font-size: 1.1rem; margin: 0 0 1.5rem 0;">
                    Báo cáo bởi: <strong>@${report.reporter.fullName}</strong> - ${new Date(report.date).toLocaleString('vi-VN')}
                </p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                <button class="btn-secondary" style="width: 100%;" onclick="AdminApp.rejectReport('${reportId}')">
                    <i class="fas fa-times"></i> Từ Chối
                </button>
                <button style="width: 100%; padding: 0.8rem 1.6rem; border: none; border-radius: 8px; font-size: 1.3rem; font-weight: 600; cursor: pointer; background: var(--admin-warning); color: white; transition: all 0.3s ease;" onclick="AdminApp.suspendUser('${report.reportedUser.id}')">
                    <i class="fas fa-pause-circle"></i> Tạm Dừng
                </button>
                <button class="btn-danger" style="width: 100%;" onclick="AdminApp.banUser('${report.reportedUser.id}', '${reportId}')">
                    <i class="fas fa-ban"></i> Cấm Tài Khoản
                </button>
            </div>
        `;

        modal.style.display = 'flex';
    }

    function closeReportDetailsModal() {
        document.getElementById('report-details-modal').style.display = 'none';
    }

    function rejectReport(reportId) {
        const report = state.reports.find(r => r.id === reportId);
        if (report) {
            report.status = 'resolved';
            closeReportDetailsModal();
            renderCurrentSection();
            showNotification('Báo cáo đã bị từ chối!', 'success');
        }
    }

    function suspendUser(userId) {
        const student = state.students.find(s => s.id === userId);
        if (student) {
            student.status = 'suspended';
            closeReportDetailsModal();
            renderCurrentSection();
            showNotification('Tài khoản người dùng đã bị tạm dừng!', 'success');
        }
    }

    function banUser(userId, reportId) {
        const student = state.students.find(s => s.id === userId);
        if (student) {
            student.status = 'banned';
        }
        const report = state.reports.find(r => r.id === reportId);
        if (report) {
            report.status = 'resolved';
        }
        closeReportDetailsModal();
        renderCurrentSection();
        showNotification('Tài khoản người dùng đã bị cấm!', 'success');
    }

    function openAdminProfileModal() {
        const modal = document.getElementById('admin-profile-modal');
        const user = state.currentUser;

        // Set user info
        document.getElementById('profile-avatar').src = user.avatar;
        document.getElementById('profile-fullname').textContent = user.name;
        document.getElementById('profile-email').textContent = '📧 ' + user.email;
        document.getElementById('profile-school').textContent = '🏢 Trung Tâm Quản Trị';
        document.getElementById('profile-points').textContent = '⭐ ' + user.totalStudents + ' Học Viên Quản Lý';

        modal.style.display = 'flex';

        // Render charts with a small delay to ensure DOM is ready
        setTimeout(() => {
            renderAdminProgressChart();
            renderAdminScoresChart();
        }, 100);
    }

    function renderAdminProgressChart() {
        const ctx = document.getElementById('progressChart');
        if (!ctx) return;

        // Destroy existing chart if any
        if (window.adminProgressChart) window.adminProgressChart.destroy();

        // Admin's learning progress data
        window.adminProgressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6'],
                datasets: [
                    {
                        label: 'Hoạt Động Tạo Cuộc Thi',
                        data: [5, 8, 12, 15, 18, 25],
                        borderColor: '#0096ec',
                        backgroundColor: 'rgba(0, 150, 236, 0.1)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 3,
                        pointRadius: 5,
                        pointBackgroundColor: '#0096ec',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    },
                    {
                        label: 'Quản Lý Học Viên',
                        data: [10, 12, 14, 16, 20, 28],
                        borderColor: '#6c5ce7',
                        backgroundColor: 'rgba(108, 92, 231, 0.1)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 3,
                        pointRadius: 5,
                        pointBackgroundColor: '#6c5ce7',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'var(--admin-text-secondary)'
                        },
                        grid: {
                            color: 'var(--admin-border)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'var(--admin-text-secondary)'
                        },
                        grid: {
                            color: 'var(--admin-border)'
                        }
                    }
                }
            }
        });
    }

    function renderAdminScoresChart() {
        const ctx = document.getElementById('scoresChart');
        if (!ctx) return;

        // Destroy existing chart if any
        if (window.adminScoresChart) window.adminScoresChart.destroy();

        window.adminScoresChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Cuộc Thi Toán', 'Cuộc Thi Hình', 'Cuộc Thi ĐS', 'Cuộc Thi HH Nâng', 'Cuộc Thi Tổng Hợp'],
                datasets: [
                    {
                        label: 'Số Cuộc Thi Tạo',
                        data: [8, 6, 7, 5, 10],
                        backgroundColor: 'rgba(0, 150, 236, 0.8)',
                        borderColor: '#0096ec',
                        borderWidth: 1,
                        borderRadius: 5
                    },
                    {
                        label: 'Lượt Tham Gia',
                        data: [125, 98, 110, 85, 156],
                        backgroundColor: 'rgba(108, 92, 231, 0.8)',
                        borderColor: '#6c5ce7',
                        borderWidth: 1,
                        borderRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'var(--admin-text-secondary)'
                        },
                        grid: {
                            color: 'var(--admin-border)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'var(--admin-text-secondary)'
                        },
                        grid: {
                            color: 'var(--admin-border)'
                        }
                    }
                }
            }
        });
    }

    function openStudentProfileModal(userId) {
        const student = state.students.find(s => s.id === userId);
        if (!student) return;

        const modal = document.getElementById('student-profile-modal');

        // Set user info
        document.getElementById('student-profile-avatar').src = student.avatar;
        document.getElementById('student-profile-fullname').textContent = student.fullName;
        document.getElementById('student-profile-email').textContent = '📧 ' + student.email;
        document.getElementById('student-profile-school').textContent = '🏢 ' + (student.school || 'Không rõ');
        document.getElementById('student-profile-points').textContent = '⭐ ' + student.studyingPoints + ' điểm';

        modal.style.display = 'flex';

        // Render charts with a small delay to ensure DOM is ready
        setTimeout(() => {
            renderStudentProgressChart(student);
            renderStudentScoresChart(student);
        }, 100);
    }

    function renderStudentProgressChart(student) {
        const ctx = document.getElementById('studentProgressChart');
        if (!ctx) return;

        // Destroy existing chart if any
        if (window.studentProgressChart) window.studentProgressChart.destroy();

        // Get progress data from student
        const progressData = student.progress || {};
        const labels = Object.keys(progressData);
        
        // Create datasets for each grade level
        const datasets = labels.map((gradeKey, index) => {
            const gradeProgress = progressData[gradeKey];
            const completed = gradeProgress.completed || 0;
            const total = gradeProgress.total || 1;
            const percentage = Math.round((completed / total) * 100);
            
            return {
                label: gradeKey === 'grade-7' ? 'Lớp 7' : gradeKey === 'grade-8' ? 'Lớp 8' : 'Lớp 9',
                data: [completed, total - completed],
                borderColor: ['#0096ec', '#6c5ce7', '#00b894'][index],
                backgroundColor: [
                    'rgba(0, 150, 236, 0.8)',
                    'rgba(108, 92, 231, 0.8)',
                    'rgba(0, 184, 148, 0.8)'
                ][index],
                borderWidth: 1,
                borderRadius: 5
            };
        });

        window.studentProgressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.entries(progressData).map(([key, val]) => {
                    const percent = Math.round((val.completed / val.total) * 100);
                    return key === 'grade-7' ? `Lớp 7 (${percent}%)` : key === 'grade-8' ? `Lớp 8 (${percent}%)` : `Lớp 9 (${percent}%)`;
                }),
                datasets: [{
                    label: 'Bài Tập Hoàn Thành',
                    data: Object.values(progressData).map(g => g.completed),
                    borderColor: '#00b894',
                    backgroundColor: 'rgba(0, 184, 148, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3,
                    pointRadius: 6,
                    pointBackgroundColor: '#00b894',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'var(--admin-text-secondary)'
                        },
                        grid: {
                            color: 'var(--admin-border)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'var(--admin-text-secondary)'
                        },
                        grid: {
                            color: 'var(--admin-border)'
                        }
                    }
                }
            }
        });
    }

    function renderStudentScoresChart(student) {
        const ctx = document.getElementById('studentScoresChart');
        if (!ctx) return;

        // Destroy existing chart if any
        if (window.studentScoresChart) window.studentScoresChart.destroy();

        // Get scores from student progress
        const progressData = student.progress || {};
        const gradeLabels = [];
        const allScores = [];

        Object.entries(progressData).forEach(([gradeKey, gradeProgress]) => {
            const scores = gradeProgress.scores || [];
            scores.forEach((score, idx) => {
                gradeLabels.push(`${gradeKey === 'grade-7' ? 'Lớp 7' : gradeKey === 'grade-8' ? 'Lớp 8' : 'Lớp 9'} - BT${idx + 1}`);
                allScores.push(score);
            });
        });

        window.studentScoresChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: gradeLabels.length > 0 ? gradeLabels : ['Chưa có dữ liệu'],
                datasets: [{
                    label: 'Điểm Số',
                    data: allScores.length > 0 ? allScores : [0],
                    backgroundColor: (context) => {
                        const value = context.parsed?.y || 0;
                        if (value >= 9) return 'rgba(0, 184, 148, 0.8)';
                        if (value >= 7) return 'rgba(0, 150, 236, 0.8)';
                        return 'rgba(253, 203, 110, 0.8)';
                    },
                    borderColor: (context) => {
                        const value = context.parsed?.y || 0;
                        if (value >= 9) return '#00b894';
                        if (value >= 7) return '#0096ec';
                        return '#fdcb6e';
                    },
                    borderWidth: 1,
                    borderRadius: 5
                }]
            },
            options: {
                indexAxis: 'x',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        ticks: {
                            color: 'var(--admin-text-secondary)'
                        },
                        grid: {
                            color: 'var(--admin-border)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'var(--admin-text-secondary)'
                        },
                        grid: {
                            color: 'var(--admin-border)'
                        }
                    }
                }
            }
        });
    }

    function closeAdminProfileModal() {
        document.getElementById('admin-profile-modal').style.display = 'none';
    }

    function closeStudentProfileModal() {
        document.getElementById('student-profile-modal').style.display = 'none';
    }

    // =============================================
    // SIDEBAR & UI
    // =============================================

    function toggleSidebar() {
        document.getElementById('admin-sidebar').classList.toggle('active');
    }

    function closeSidebar() {
        document.getElementById('admin-sidebar').classList.remove('active');
    }

    function toggleSettingsMenu() {
        const dropdown = document.getElementById('settings-dropdown');
        dropdown.classList.toggle('active');
    }

    async function logout() {
        if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
            // Call logout from parent window (main tab)
            if (window.opener && !window.opener.closed) {
                await window.opener.Auth.logout();
            }
            // Close admin tab
            window.close();
        }
    }

    // =============================================
    // UTILITIES
    // =============================================

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1.5rem 2rem;
            background: ${type === 'success' ? 'var(--admin-success)' : type === 'error' ? 'var(--admin-danger)' : 'var(--admin-info)'};
            color: white;
            border-radius: 8px;
            z-index: 3000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    // =============================================
    // PUBLIC API
    // =============================================

    return {
        init,
        editContest: (id) => openContestModal(id),
        deleteContest: (id) => {
            if (confirm('Bạn có chắc muốn xóa cuộc thi này?')) {
                const result = ContestSystem.deleteContest(id);
                if (result.success) {
                    renderSection('contests');
                    showNotification(result.message, 'success');
                } else {
                    showNotification(result.message, 'error');
                }
            }
        },
        openUserActionModal,
        openReportDetailsModal,
        closeReportDetailsModal,
        rejectReport,
        suspendUser,
        banUser,
        closeAdminProfileModal,
        openStudentProfileModal,
        closeStudentProfileModal
    };
})();
*/

// Legacy code disabled - using AdminPageUI instead
// document.addEventListener('DOMContentLoaded', AdminApp.init);
