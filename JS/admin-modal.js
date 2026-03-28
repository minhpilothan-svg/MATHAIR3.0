// MathAir Admin Modal System - Cho phép hiển thị admin.html trong modal khi đăng nhập

const AdminModal = {
    isOpen: false,

    /**
     * Render admin modal HTML
     */
    renderAdminModal() {
        const mainContent = document.getElementById('main-content');
        
        // Check if admin modal already exists
        if (document.getElementById('admin-panel-modal')) {
            return;
        }

        const adminModalHTML = `
            <div id="admin-panel-modal" class="admin-panel-modal" style="display: none;">
                <div class="admin-modal-overlay"></div>
                <div class="admin-modal-container">
                    <div class="admin-modal-header">
                        <div class="admin-modal-title">
                            <i class="fas fa-crown"></i>
                            <span id="admin-modal-title-text">Bảng Điều Khiển Admin</span>
                        </div>
                        <button class="admin-modal-close" id="admin-modal-close" title="Đóng">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="admin-modal-body" id="admin-modal-body">
                        <div class="admin-modal-tabs">
                            <button class="admin-tab-btn active" data-tab="dashboard" title="Trang chủ admin">
                                <i class="fas fa-chart-line"></i>
                                Dashboard
                            </button>
                            <button class="admin-tab-btn" data-tab="users" title="Quản lý người dùng">
                                <i class="fas fa-users"></i>
                                Quản Lý Người Dùng
                            </button>
                            <button class="admin-tab-btn" data-tab="roles" title="Quản lý vai trò">
                                <i class="fas fa-shield-alt"></i>
                                Quản Lý Vai Trò
                            </button>
                            <button class="admin-tab-btn" data-tab="analytics" title="Thống kê">
                                <i class="fas fa-chart-pie"></i>
                                Thống Kê
                            </button>
                        </div>
                        <div class="admin-tabs-content" id="admin-tabs-content">
                            <!-- Tab contents will be loaded here -->
                        </div>
                    </div>
                    <div class="admin-modal-footer">
                        <button class="btn btn-secondary" id="admin-modal-minimize" title="Thu nhỏ">
                            <i class="fas fa-minus"></i>
                            Thu Nhỏ
                        </button>
                        <button class="btn btn-secondary" id="admin-modal-fullscreen" title="Toàn màn hình">
                            <i class="fas fa-expand"></i>
                            Toàn Màn Hình
                        </button>
                        <button class="btn btn-primary" id="admin-modal-keep-open" title="Giữ cửa sổ">
                            <i class="fas fa-thumbtack"></i>
                            Giữ Mở
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Insert modal into page
        mainContent.insertAdjacentHTML('beforeend', adminModalHTML);
        this.attachEventListeners();
    },

    /**
     * Show admin modal after login
     */
    async showAdminModal() {
        const role = RoleManager.getCurrentRole();
        
        // Check if user has access to admin
        if (!RoleManager.canAccessAdmin()) {
            console.log('User does not have admin access');
            return false;
        }

        this.renderAdminModal();
        const modal = document.getElementById('admin-panel-modal');
        
        if (modal) {
            modal.style.display = 'block';
            this.isOpen = true;
            
            // Load dashboard content
            await this.loadTabContent('dashboard');
            
            // Log session
            console.log(`Admin panel opened for role: ${role}`);
            
            return true;
        }

        return false;
    },

    /**
     * Load tab content dynamically
     */
    async loadTabContent(tabName) {
        const contentArea = document.getElementById('admin-tabs-content');
        
        if (!contentArea) return;

        // Clear previous content
        contentArea.innerHTML = '<div class="loading-spinner"><p>Đang tải...</p></div>';

        switch (tabName) {
            case 'dashboard':
                await this.loadDashboard(contentArea);
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
            default:
                contentArea.innerHTML = '<p>Tab không tồn tại</p>';
        }
    },

    /**
     * Load dashboard content
     */
    async loadDashboard(contentArea) {
        try {
            const usersSnap = await window.firebaseDb.collection('users').get();
            const totalUsers = usersSnap.size;

            let adminCount = 0, reviewerCount = 0, userCount = 0;
            usersSnap.forEach(doc => {
                const role = doc.data().role || 'user';
                if (role === 'admin') adminCount++;
                else if (role === 'reviewer') reviewerCount++;
                else userCount++;
            });

            contentArea.innerHTML = `
                <div class="admin-dashboard">
                    <h3>Tổng Quan Hệ Thống</h3>
                    <div class="dashboard-grid">
                        <div class="dashboard-card">
                            <div class="card-icon admin-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="card-content">
                                <p class="card-label">Tổng Người Dùng</p>
                                <p class="card-value">${totalUsers}</p>
                            </div>
                        </div>
                        <div class="dashboard-card">
                            <div class="card-icon admin-icon">
                                <i class="fas fa-crown"></i>
                            </div>
                            <div class="card-content">
                                <p class="card-label">Quản Trị Viên</p>
                                <p class="card-value">${adminCount}</p>
                            </div>
                        </div>
                        <div class="dashboard-card">
                            <div class="card-icon admin-icon">
                                <i class="fas fa-check"></i>
                            </div>
                            <div class="card-content">
                                <p class="card-label">Người Chấm Chữa</p>
                                <p class="card-value">${reviewerCount}</p>
                            </div>
                        </div>
                        <div class="dashboard-card">
                            <div class="card-icon admin-icon">
                                <i class="fas fa-user"></i>
                            </div>
                            <div class="card-content">
                                <p class="card-label">Người Dùng Thường</p>
                                <p class="card-value">${userCount}</p>
                            </div>
                        </div>
                    </div>
                    <div class="admin-actions" style="margin-top: 20px;">
                        <h4>Hành Động Nhanh</h4>
                        <button class="btn btn-primary" onclick="AdminModal.switchTab('users')">
                            <i class="fas fa-user-edit"></i> Quản Lý Người Dùng
                        </button>
                        <button class="btn btn-primary" onclick="AdminModal.switchTab('roles')">
                            <i class="fas fa-shield-alt"></i> Quản Lý Vai Trò
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading dashboard:', error);
            contentArea.innerHTML = `<p class="error-message">Lỗi khi tải dashboard: ${error.message}</p>`;
        }
    },

    /**
     * Load users management tab
     */
    async loadUsersTab(contentArea) {
        try {
            const usersSnap = await window.firebaseDb.collection('users').get();
            let usersHTML = `
                <div class="admin-users-tab">
                    <h3>Quản Lý Người Dùng</h3>
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

            usersSnap.forEach(doc => {
                const user = doc.data();
                const role = user.role || 'user';
                const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A';
                
                usersHTML += `
                    <tr>
                        <td>${user.username || user.email}</td>
                        <td>${user.email}</td>
                        <td>
                            <span class="role-badge role-${role}">
                                ${RoleManager.ROLES[role]?.name || 'Unknown'}
                            </span>
                        </td>
                        <td>${createdAt}</td>
                        <td>
                            <button class="btn btn-sm btn-secondary" onclick="AdminModal.changeUserRole('${doc.id}')">
                                <i class="fas fa-edit"></i> Đổi Role
                            </button>
                        </td>
                    </tr>
                `;
            });

            usersHTML += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            contentArea.innerHTML = usersHTML;
        } catch (error) {
            console.error('Error loading users tab:', error);
            contentArea.innerHTML = `<p class="error-message">Lỗi khi tải danh sách người dùng: ${error.message}</p>`;
        }
    },

    /**
     * Load roles management tab
     */
    async loadRolesTab(contentArea) {
        const roles = RoleManager.getAllRoles();
        
        let rolesHTML = `
            <div class="admin-roles-tab">
                <h3>Quản Lý Vai Trò</h3>
                <div class="roles-grid">
        `;

        Object.entries(roles).forEach(([roleId, roleConfig]) => {
            rolesHTML += `
                <div class="role-card">
                    <div class="role-card-header">
                        <h4>${roleConfig.name}</h4>
                        <span class="role-id">(${roleId})</span>
                    </div>
                    <div class="role-card-body">
                        <p><strong>Quyền Hạn:</strong></p>
                        <ul>
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
                        <p style="margin-top: 10px;">
                            <strong>Truy Cập Admin:</strong> 
                            ${roleConfig.canAccessAdmin ? '<span style="color: green;">✓ Có</span>' : '<span style="color: red;">✗ Không</span>'}
                        </p>
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
            <div class="admin-analytics-tab">
                <h3>Thống Kê Hệ Thống</h3>
                <div class="analytics-placeholder">
                    <p>Chức năng thống kê sẽ được cập nhật sau</p>
                    <p>Sẽ hiển thị:</p>
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
     * Switch between tabs
     */
    switchTab(tabName) {
        // Update active tab button
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // Load tab content
        this.loadTabContent(tabName);
    },

    /**
     * Change user role dialog
     */
    changeUserRole(userId) {
        const roles = Object.entries(RoleManager.getAllRoles()).map(([key, val]) => ({
            id: key,
            name: val.name
        }));

        let roleOptions = roles.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
        
        const dialog = document.createElement('div');
        dialog.className = 'role-change-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay"></div>
            <div class="dialog-box">
                <h3>Thay Đổi Vai Trò Người Dùng</h3>
                <div class="dialog-body">
                    <label>Chọn vai trò mới:</label>
                    <select id="new-role-select">
                        ${roleOptions}
                    </select>
                </div>
                <div class="dialog-actions">
                    <button class="btn btn-secondary" onclick="this.closest('.role-change-dialog').remove()">
                        Hủy
                    </button>
                    <button class="btn btn-primary" onclick="AdminModal.confirmChangeRole('${userId}')">
                        Xác Nhận
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
    },

    /**
     * Confirm and execute role change
     */
    async confirmChangeRole(userId) {
        const select = document.getElementById('new-role-select');
        const newRole = select?.value;

        if (!newRole) return;

        try {
            const result = await RoleManager.updateUserRole(userId, newRole);
            
            alert(result.message);
            
            if (result.success) {
                // Reload users tab
                document.querySelector('[data-tab="users"]').click();
            }

            // Remove dialog
            document.querySelector('.role-change-dialog')?.remove();
        } catch (error) {
            console.error('Error changing role:', error);
            alert('Lỗi: ' + error.message);
        }
    },

    /**
     * Hide admin modal
     */
    hide() {
        const modal = document.getElementById('admin-panel-modal');
        if (modal) {
            modal.style.display = 'none';
            this.isOpen = false;
        }
    },

    /**
     * Close admin modal
     */
    close() {
        this.hide();
    },

    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        const modal = document.getElementById('admin-panel-modal');
        if (modal) {
            modal.classList.toggle('fullscreen');
        }
    },

    /**
     * Minimize modal
     */
    minimize() {
        const modal = document.getElementById('admin-panel-modal');
        if (modal) {
            modal.classList.toggle('minimized');
        }
    },

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Tab switching
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.currentTarget.dataset.tab);
            });
        });

        // Close button
        const closeBtn = document.getElementById('admin-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Minimize button
        const minimizeBtn = document.getElementById('admin-modal-minimize');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => this.minimize());
        }

        // Fullscreen button
        const fullscreenBtn = document.getElementById('admin-modal-fullscreen');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }

        // Keep open button
        const keepOpenBtn = document.getElementById('admin-modal-keep-open');
        if (keepOpenBtn) {
            keepOpenBtn.addEventListener('click', () => {
                keepOpenBtn.classList.toggle('pinned');
                keepOpenBtn.querySelector('i').classList.toggle('pinned');
            });
        }

        // Close on overlay click
        const overlay = document.querySelector('.admin-modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                const keepOpenBtn = document.getElementById('admin-modal-keep-open');
                if (!keepOpenBtn?.classList.contains('pinned')) {
                    this.close();
                }
            });
        }
    }
};

// Make available globally
window.AdminModal = AdminModal;
