// MathAir Role-Based Access Control System

const RoleManager = {
    // Define roles and their permissions
    ROLES: {
        user: {
            name: 'Người Dùng',
            permissions: ['view_courses', 'take_quiz', 'view_profile', 'view_contests'],
            canAccessAdmin: false,
            canAccessReviewer: false
        },
        reviewer: {
            name: 'Người Chấm Chữa',
            permissions: ['view_courses', 'take_quiz', 'view_profile', 'view_contests', 'review_submissions', 'view_analytics'],
            canAccessAdmin: true,
            canAccessReviewer: true
        },
        admin: {
            name: 'Quản Trị Viên',
            permissions: ['*'], // All permissions
            canAccessAdmin: true,
            canAccessReviewer: true
        }
    },

    /**
     * Get current user's role
     */
    getCurrentRole() {
        const user = Auth.getCurrentUser();
        return user?.role || 'user';
    },

    /**
     * Check if current user has a specific permission
     */
    hasPermission(permission) {
        const role = this.getCurrentRole();
        const roleConfig = this.ROLES[role];
        
        if (!roleConfig) return false;
        if (roleConfig.permissions.includes('*')) return true;
        return roleConfig.permissions.includes(permission);
    },

    /**
     * Check if user can access admin panel
     */
    canAccessAdmin() {
        const role = this.getCurrentRole();
        const roleConfig = this.ROLES[role];
        return roleConfig?.canAccessAdmin || false;
    },

    /**
     * Check if user can access reviewer panel
     */
    canAccessReviewer() {
        const role = this.getCurrentRole();
        const roleConfig = this.ROLES[role];
        return roleConfig?.canAccessReviewer || false;
    },

    /**
     * Get list of accessible panels for current user
     */
    getAccessiblePanels() {
        const panels = [];
        if (this.canAccessAdmin()) panels.push({ id: 'admin', label: 'Trang Admin', icon: 'fa-crown' });
        if (this.canAccessReviewer()) panels.push({ id: 'reviewer', label: 'Trang Chấm Chữa', icon: 'fa-check' });
        return panels;
    },

    /**
     * Update user role in Firebase (Admin only)
     */
    async updateUserRole(userId, newRole) {
        const currentUser = Auth.getCurrentUser();
        
        // Check if current user is admin
        if (currentUser?.role !== 'admin') {
            console.error('Chỉ admin mới có thể cập nhật role của người dùng khác');
            return {
                success: false,
                message: 'Bạn không có quyền thực hiện hành động này!'
            };
        }

        // Validate role
        if (!this.ROLES[newRole]) {
            return {
                success: false,
                message: 'Role không hợp lệ!'
            };
        }

        try {
            await window.firebaseDb.collection('users').doc(userId).update({
                role: newRole
            });

            return {
                success: true,
                message: `Cập nhật role thành công: ${this.ROLES[newRole].name}`
            };
        } catch (error) {
            console.error('Error updating user role:', error);
            return {
                success: false,
                message: 'Cập nhật role thất bại: ' + error.message
            };
        }
    },

    /**
     * Get role configuration
     */
    getRoleConfig(role) {
        return this.ROLES[role] || null;
    },

    /**
     * Get all roles (for admin management)
     */
    getAllRoles() {
        return this.ROLES;
    }
};

// Make available globally
window.RoleManager = RoleManager;
