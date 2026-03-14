// MathAir Authentication System - Firebase Edition

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
    firebaseUser: null,
    
    // Initialize - Wait for Firebase and check session
    async init() {
        return new Promise((resolve) => {
            // Wait for Firebase to be initialized
            const checkFirebase = setInterval(() => {
                if (window.firebaseAuth && window.firebaseDb) {
                    clearInterval(checkFirebase);
                    
                    // Set up auth state listener
                    window.firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
                        if (firebaseUser) {
                            this.firebaseUser = firebaseUser;
                            await this.loadUserProfile(firebaseUser.uid);
                        } else {
                            this.firebaseUser = null;
                            this.currentUser = null;
                        }
                        resolve(true);
                    });
                }
            }, 100);
        });
    },
    
    // Load user profile from Firestore
    async loadUserProfile(uid) {
        try {
            const userDoc = await window.firebaseDb.collection('users').doc(uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.currentUser = {
                    id: uid,
                    email: this.firebaseUser.email,
                    ...userData
                };
                localStorage.setItem('mathair_user', JSON.stringify(this.currentUser));
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    },
    
    // Signup function with Firebase Authentication
    async signup(userData) {
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
        
        try {
            // Check if username already exists
            const usernameQuery = await window.firebaseDb.collection('users').where('username', '==', username).get();
            if (!usernameQuery.empty) {
                return {
                    success: false,
                    message: 'Tên đăng nhập đã tồn tại!'
                };
            }
            
            // Create user in Firebase Authentication
            const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;
            
            // Create user profile in Firestore
            const userProfile = {
                username,
                email,
                fullName: fullName || username,
                dateOfBirth: dateOfBirth || '',
                school: school || '',
                grade: grade || '',
                role: 'user',
                avatar: 'https://via.placeholder.com/150',
                progress: {
                    'grade-7': { completed: 0, total: 40, scores: [] },
                    'grade-8': { completed: 0, total: 45, scores: [] },
                    'grade-9': { completed: 0, total: 50, scores: [] }
                },
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };
            
            await window.firebaseDb.collection('users').doc(uid).set(userProfile);
            
            // Set current user
            this.currentUser = {
                id: uid,
                email,
                ...userProfile
            };
            
            localStorage.setItem('mathair_user', JSON.stringify(this.currentUser));
            
            return {
                success: true,
                message: 'Đăng ký thành công!',
                user: this.currentUser
            };
        } catch (error) {
            console.error('Signup error:', error);
            
            // Handle specific Firebase errors
            if (error.code === 'auth/email-already-in-use') {
                return {
                    success: false,
                    message: 'Email đã được đăng ký!'
                };
            } else if (error.code === 'auth/weak-password') {
                return {
                    success: false,
                    message: 'Mật khẩu không đủ mạnh!'
                };
            } else if (error.code === 'auth/invalid-email') {
                return {
                    success: false,
                    message: 'Email không hợp lệ!'
                };
            }
            
            return {
                success: false,
                message: 'Đăng ký thất bại: ' + error.message
            };
        }
    },
    
    // Login function with Firebase Authentication
    async login(email, password) {
        // Validate inputs
        if (!email || !password) {
            return {
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin!'
            };
        }
        
        try {
            // Authenticate with Firebase
            const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;
            
            // Load user profile from Firestore
            const userDoc = await window.firebaseDb.collection('users').doc(uid).get();
            
            if (!userDoc.exists) {
                // If profile doesn't exist, create a basic one
                const basicProfile = {
                    email,
                    role: 'user',
                    avatar: 'https://via.placeholder.com/150',
                    progress: {
                        'grade-7': { completed: 0, total: 40, scores: [] },
                        'grade-8': { completed: 0, total: 45, scores: [] },
                        'grade-9': { completed: 0, total: 50, scores: [] }
                    },
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                };
                
                await window.firebaseDb.collection('users').doc(uid).set(basicProfile);
                
                this.currentUser = {
                    id: uid,
                    email,
                    ...basicProfile
                };
            } else {
                const userData = userDoc.data();
                
                // Update lastLogin
                await window.firebaseDb.collection('users').doc(uid).update({
                    lastLogin: new Date().toISOString()
                });
                
                this.currentUser = {
                    id: uid,
                    email,
                    ...userData
                };
            }
            
            localStorage.setItem('mathair_user', JSON.stringify(this.currentUser));
            this.firebaseUser = userCredential.user;
            
            return {
                success: true,
                message: 'Đăng nhập thành công!',
                user: this.currentUser
            };
        } catch (error) {
            console.error('Login error:', error);
            
            // Handle specific Firebase errors
            if (error.code === 'auth/user-not-found') {
                return {
                    success: false,
                    message: 'Email không tồn tại trong hệ thống!'
                };
            } else if (error.code === 'auth/wrong-password') {
                return {
                    success: false,
                    message: 'Mật khẩu không chính xác!'
                };
            } else if (error.code === 'auth/invalid-email') {
                return {
                    success: false,
                    message: 'Email không hợp lệ!'
                };
            } else if (error.code === 'auth/too-many-requests') {
                return {
                    success: false,
                    message: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau!'
                };
            }
            
            return {
                success: false,
                message: 'Đăng nhập thất bại: ' + error.message
            };
        }
    },
    
    // Logout function
    async logout() {
        try {
            await window.firebaseAuth.signOut();
            this.currentUser = null;
            this.firebaseUser = null;
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
        } catch (error) {
            console.error('Logout error:', error);
        }
    },
    
    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    },
    
    // Get current user
    getCurrentUser() {
        return this.currentUser;
    },
    
    // Update user progress in Firestore
    async updateProgress(gradeId, chapterId, score) {
        if (!this.currentUser || !this.firebaseUser) return;
        
        try {
            if (!this.currentUser.progress[gradeId]) {
                this.currentUser.progress[gradeId] = {
                    completed: 0,
                    total: 0,
                    scores: []
                };
            }
            
            this.currentUser.progress[gradeId].completed++;
            this.currentUser.progress[gradeId].scores.push(score);
            
            // Update in Firestore
            await window.firebaseDb.collection('users').doc(this.firebaseUser.uid).update({
                progress: this.currentUser.progress
            });
            
            // Update localStorage
            localStorage.setItem('mathair_user', JSON.stringify(this.currentUser));
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    },
    
    // Update user profile
    async updateProfile(updates) {
        if (!this.currentUser || !this.firebaseUser) return;
        
        try {
            // Update current user object
            Object.assign(this.currentUser, updates);
            
            // Update in Firestore
            await window.firebaseDb.collection('users').doc(this.firebaseUser.uid).update(updates);
            
            // Update localStorage
            localStorage.setItem('mathair_user', JSON.stringify(this.currentUser));
            
            return {
                success: true,
                message: 'Cập nhật thành công!'
            };
        } catch (error) {
            console.error('Error updating profile:', error);
            return {
                success: false,
                message: 'Cập nhật thất bại!'
            };
        }
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

// Render Login & Signup pages moved to app.js