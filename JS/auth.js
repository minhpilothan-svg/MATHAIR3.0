// MathAir Authentication System

// Toggle password visibility
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const btn = event.target.closest('.toggle-password-btn');
    
    if (input.type === 'password') {
        input.type = 'text';
        btn.querySelector('.eye-icon').textContent = '🙈';
    } else {
        input.type = 'password';
        btn.querySelector('.eye-icon').textContent = '👁️';
    }
}

const Auth = {
    currentUser: null,
    users: [],
    
    // Initialize - Load users from JSON and check if logged in
    async init() {
        await this.loadUsers();
        this.checkSession();
        return true;
    },
    
    // Load users from JSON file
    async loadUsers() {
        try {
            const response = await fetch('DATA/users.json');
            if (!response.ok) throw new Error('Failed to load users');
            const data = await response.json();
            this.users = data.users || [];
        } catch (error) {
            console.error('Error loading users:', error);
            this.users = [];
        }
    },
    
    // Check if user is logged in (from localStorage)
    checkSession() {
        const savedUser = localStorage.getItem('mathair_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                return true;
            } catch (error) {
                console.error('Invalid session data');
                localStorage.removeItem('mathair_user');
            }
        }
        return false;
    },
    
    // Login function
    login(email, password) {
        // Validate inputs
        if (!email || !password) {
            return {
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin!'
            };
        }
        
        // Find user by email
        const user = this.users.find(u => u.email === email);
        
        if (!user) {
            return {
                success: false,
                message: 'Email không tồn tại trong hệ thống!'
            };
        }
        
        // Check password
        if (user.password !== password) {
            return {
                success: false,
                message: 'Mật khẩu không chính xác!'
            };
        }
        
        // Success - Update lastLogin to current time
        this.currentUser = user;
        user.lastLogin = new Date().toISOString();
        localStorage.setItem('mathair_user', JSON.stringify(user));
        
        // Also update in users array for consistency
        const userIndex = this.users.findIndex(u => u.email === email);
        if (userIndex !== -1) {
            this.users[userIndex].lastLogin = user.lastLogin;
        }
        
        return {
            success: true,
            message: 'Đăng nhập thành công!',
            user: user
        };
    },
    
    // Signup function
    signup(userData) {
        const { username, email, password, confirmPassword, fullName, dateOfBirth, school, grade } = userData;
        
        // Validate inputs
        if (!username || !email || !password || !confirmPassword) {
            return {
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin bắt buộc!'
            };
        }
        
        // Validate username length
        if (username.length < 6 || username.length > 18) {
            return {
                success: false,
                message: 'Tên đăng nhập phải từ 6-18 ký tự!'
            };
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                success: false,
                message: 'Email không hợp lệ!'
            };
        }
        
        // Validate password length
        if (password.length < 6 || password.length > 18) {
            return {
                success: false,
                message: 'Mật khẩu phải từ 6-18 ký tự!'
            };
        }
        
        // Check password match
        if (password !== confirmPassword) {
            return {
                success: false,
                message: 'Mật khẩu xác nhận không khớp!'
            };
        }
        
        // Check if username exists
        if (this.users.find(u => u.username === username)) {
            return {
                success: false,
                message: 'Tên đăng nhập đã tồn tại!'
            };
        }
        
        // Check if email exists
        if (this.users.find(u => u.email === email)) {
            return {
                success: false,
                message: 'Email đã được đăng ký!'
            };
        }
        
        // Create new user
        const newUser = {
            id: `user_${Date.now()}`,
            username,
            email,
            password,
            fullName: fullName || username,
            dateOfBirth: dateOfBirth || '',
            school: school || '',
            grade: grade || '',
            role: 'user',  // Default role for new users
            avatar: 'https://via.placeholder.com/150',
            progress: {
                'grade-7': { completed: 0, total: 40, scores: [] },
                'grade-8': { completed: 0, total: 45, scores: [] },
                'grade-9': { completed: 0, total: 50, scores: [] }
            },
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        
        // Add to users array
        this.users.push(newUser);
        
        // Auto login
        this.currentUser = newUser;
        localStorage.setItem('mathair_user', JSON.stringify(newUser));
        
        // Note: In real app, you'd save to server/database here
        console.log('New user created:', newUser);
        
        return {
            success: true,
            message: 'Đăng ký thành công!',
            user: newUser
        };
    },
    
    // Logout function
    logout() {
        this.currentUser = null;
        localStorage.removeItem('mathair_user');
        
        // Close admin tab if open
        if (window.adminTabWindow && !window.adminTabWindow.closed) {
            window.adminTabWindow.close();
        }
        
        // Close reviewer tab if open
        if (window.reviewerTabWindow && !window.reviewerTabWindow.closed) {
            window.reviewerTabWindow.close();
        }
        
        renderHeader();
        navigateTo('login');
    },
    
    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    },
    
    // Get current user
    getCurrentUser() {
        return this.currentUser;
    },
    
    // Update user progress
    updateProgress(gradeId, chapterId, score) {
        if (!this.currentUser) return;
        
        if (!this.currentUser.progress[gradeId]) {
            this.currentUser.progress[gradeId] = {
                completed: 0,
                total: 0,
                scores: []
            };
        }
        
        this.currentUser.progress[gradeId].completed++;
        this.currentUser.progress[gradeId].scores.push(score);
        
        // Save to localStorage
        localStorage.setItem('mathair_user', JSON.stringify(this.currentUser));
    },
    
    // Require login for protected pages
    requireLogin() {
        if (!this.isLoggedIn()) {
            navigateTo('login');
            return false;
        }
        return true;
    }
};

// Render Login Page
function renderLoginPage() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div class="auth-container">
            <form class="user-info" id="login-form" onsubmit="handleLogin(event)">
                <div class="header">
                    <h1>Đăng Nhập Tài Khoản</h1>
                    <p>Chào mừng trở lại! Vui lòng nhập email và mật khẩu.</p>
                </div>
                
                <div class="input-group">
                    <label for="login-email">Email</label>
                    <input 
                        type="email" 
                        id="login-email" 
                        name="email" 
                        placeholder="Nhập email của bạn"
                        required
                    >
                </div>
                
                <div class="input-group">
                    <label for="login-password">Mật khẩu</label>
                    <div class="password-input-wrapper">
                        <input 
                            type="password" 
                            id="login-password" 
                            name="password" 
                            placeholder="Nhập mật khẩu"
                            minlength="6"
                            maxlength="18"
                            required
                        >
                        <button type="button" class="toggle-password-btn" onclick="togglePasswordVisibility('login-password')" title="Hiện/ẩn mật khẩu">
                            <span class="eye-icon">👁️</span>
                        </button>
                    </div>
                </div>
                
                <div id="login-error" class="error-msg" style="display: none;"></div>
                
                <div class="submit-group">
                    <button type="submit" class="submit">Đăng Nhập</button>
                </div>
                
                <div style="text-align: center; color: white; font-size: 1.4rem; margin-top: 1rem;">
                    Chưa có tài khoản? 
                    <a href="#" onclick="navigateTo('signup')" style="color: white; font-weight: 700; text-decoration: underline;">
                        Đăng ký ngay
                    </a>
                </div>
            </form>
        </div>
    `;
}

// Render Signup Page
function renderSignupPage() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div class="auth-container">
            <form class="user-info signup-form" id="signup-form" onsubmit="handleSignup(event)">
                <div class="header">
                    <h1>Đăng ký</h1>
                    <p>Chào mừng! Vui lòng điền thông tin để tạo tài khoản.</p>
                </div>

                <div class="input-group">
                    <label for="signup-username">Tên đăng nhập *</label>
                    <input 
                        type="text" 
                        id="signup-username" 
                        name="username" 
                        placeholder="6-18 ký tự"
                        minlength="6"
                        maxlength="18"
                        required
                    >
                </div>

                <div class="input-group">
                    <label for="signup-email">Email *</label>
                    <input 
                        type="email" 
                        id="signup-email" 
                        name="email" 
                        placeholder="email@example.com"
                        required
                    >
                </div>
                
                <div class="input-group">
                    <label for="signup-password">Mật khẩu *</label>
                    <div class="password-input-wrapper">
                        <input 
                            type="password" 
                            id="signup-password" 
                            name="password" 
                            placeholder="6-18 ký tự"
                            minlength="6"
                            maxlength="18"
                            required
                        >
                        <button type="button" class="toggle-password-btn" onclick="togglePasswordVisibility('signup-password')" title="Hiện/ẩn mật khẩu">
                            <span class="eye-icon">👁️</span>
                        </button>
                    <div class="password-input-wrapper">
                        <input 
                            type="password" 
                            id="signup-confirm-password" 
                            name="confirmPassword"
                            placeholder="Nhập lại mật khẩu"
                            minlength="6"
                            maxlength="18"
                            required
                        >
                        <button type="button" class="toggle-password-btn" onclick="togglePasswordVisibility('signup-confirm-password')" title="Hiện/ẩn mật khẩu">
                            <span class="eye-icon">👁️</span>
                        </button>
                    </div    name="confirmPassword"
                        placeholder="Nhập lại mật khẩu"
                        minlength="6"
                        maxlength="18"
                        required
                    >
                </div>
                
                <div class="input-group">
                    <label for="signup-fullname">Họ và tên</label>
                    <input 
                        type="text" 
                        id="signup-fullname" 
                        name="fullName" 
                        placeholder="Nhập họ tên đầy đủ"
                    >
                </div>
                
                <div class="input-group">
                    <label for="signup-dob">Ngày sinh</label>
                    <input 
                        type="text" 
                        id="signup-dob" 
                        name="dateOfBirth" 
                        placeholder="DD/MM/YYYY"
                    >
                </div>
                
                <div class="input-group">
                    <label for="signup-school">Trường</label>
                    <input 
                        type="text" 
                        id="signup-school" 
                        name="school" 
                        placeholder="Tên trường học"
                    >
                </div>
                
                <div class="input-group">
                    <label for="signup-grade">Lớp</label>
                    <input 
                        type="text" 
                        id="signup-grade" 
                        name="grade" 
                        placeholder="VD: 9D1"
                    >
                </div>
                
                <div id="signup-error" class="error-msg" style="display: none; width: 100%;"></div>
                
                <div class="submit-group">
                    <button type="submit" class="submit">Đăng ký</button>
                </div>
                
                <div style="width: 100%; text-align: center; color: white; font-size: 1.4rem; margin-top: 1rem;">
                    Đã có tài khoản? 
                    <a href="#" onclick="navigateTo('login')" style="color: white; font-weight: 700; text-decoration: underline;">
                        Đăng nhập ngay
                    </a>
                </div>
            </form>
        </div>
    `;
}

// Handle Login Form Submit
function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const email = form.email.value.trim();
    const password = form.password.value;
    
    const result = Auth.login(email, password);
    
    const errorDiv = document.getElementById('login-error');
    
    if (result.success) {
        // Show success message briefly
        errorDiv.style.display = 'block';
        errorDiv.style.color = '#00ff00';
        errorDiv.style.fontWeight = 'bold';
        errorDiv.style.fontSize = '1.2rem';
        errorDiv.textContent = result.message;
        
        // Check user role and redirect accordingly
        setTimeout(() => {
            const user = Auth.getCurrentUser();
            renderHeader();
            if (user.role === 'admin') {
                // Admin: Open admin.html in new tab and save reference
                const adminWindow = window.open('admin.html', '_blank', 'width=1400,height=900');
                if (adminWindow) {
                    window.adminTabWindow = adminWindow;
                }
                navigateTo('home');
            } else if (user.role === 'reviewer') {
                // Reviewer: Keep index.html and open admin.html
                const reviewerWindow = window.open('admin.html', '_blank', 'width=1400,height=900');
                if (reviewerWindow) {
                    window.reviewerTabWindow = reviewerWindow;
                }
                navigateTo('home');
            } else {
                // Regular user: Go to home page
                navigateTo('home');
            }
        }, 1000);
    } else {
        // Show error message
        errorDiv.style.display = 'block';
        errorDiv.style.color = '#ff3333';
        errorDiv.style.fontWeight = 'bold';
        errorDiv.style.fontSize = '1.2rem';
        errorDiv.textContent = result.message;
    }
}

// Handle Signup Form Submit
function handleSignup(event) {
    event.preventDefault();
    
    const form = event.target;
    const userData = {
        username: form.username.value.trim(),
        email: form.email.value.trim(),
        password: form.password.value,
        confirmPassword: form.confirmPassword.value,
        fullName: form.fullName.value.trim(),
        dateOfBirth: form.dateOfBirth.value.trim(),
        school: form.school.value.trim(),
        grade: form.grade.value.trim()
    };
    
    const result = Auth.signup(userData);
    
    const errorDiv = document.getElementById('signup-error');
    
    if (result.success) {
        // Show success message
        errorDiv.style.display = 'block';
        errorDiv.style.color = '#00ff00';
        errorDiv.style.fontWeight = 'bold';
        errorDiv.style.fontSize = '1.2rem';
        errorDiv.textContent = result.message + ' Đang chuyển hướng...';
        
        // Redirect to home after 1.5 seconds
        setTimeout(() => {
            navigateTo('home');
        }, 1500);
    } else {
        // Show error message
        errorDiv.style.display = 'block';
        errorDiv.style.color = '#ff3333';
        errorDiv.style.fontWeight = 'bold';
        errorDiv.style.fontSize = '1.2rem';
        errorDiv.textContent = result.message;
    }
}

// Initialize Auth on page load
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});