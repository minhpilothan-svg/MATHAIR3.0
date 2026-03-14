// MathAir Main Application

// Global App State
const AppState = {
    currentPage: 'home',
    currentGrade: null,
    currentChapter: null,
    grades: [],
    chapters: [],
    questions: []
};

// Load JSON data
async function loadJSON(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error loading ${path}:`, error);
        return null;
    }
}

// Initialize data
async function initializeData() {
    const [gradesData, chaptersData, questionsData] = await Promise.all([
        loadJSON('DATA/grades.json'),
        loadJSON('DATA/chapters.json'),
        loadJSON('DATA/questions.json')
    ]);
    
    if (gradesData) AppState.grades = gradesData.grades || [];
    if (chaptersData) AppState.chapters = chaptersData.chapters || [];
    if (questionsData) AppState.questions = questionsData.questions || [];
}

// ==================== HEADER RENDERING ====================

function renderHeader() {
    const header = document.getElementById('app-header');
    const appFooter = document.getElementById('app-footer');
    const isLoggedIn = Auth.isLoggedIn();
    const currentUser = Auth.getCurrentUser();
    
    // Show header and footer if logged in
    if (isLoggedIn) {
        header.style.display = 'flex';
        if (appFooter) appFooter.style.display = 'block';
    } else {
        header.style.display = 'none';
        if (appFooter) appFooter.style.display = 'none';
    }
    
    header.innerHTML = `
        <div class="header-l">
            <h1 class="logo" onclick="navigateTo('home'); return false;" title="Về trang chủ">MathAir</h1>
        </div>
        <div class="header-c">
            <nav class="nav">
                <ul>
                    ${isLoggedIn ? `<li><a href="#" onclick="navigateTo('home'); return false;">Trang chủ</a></li>` : ''}
                    ${isLoggedIn ? `
                        <li><a href="#" onclick="navigateTo('profile'); return false;">Hồ sơ</a></li>
                    ` : ''}
                </ul>
            </nav>
        </div>
        <div class="header-r">
            <button class="hamburger-btn" id="hamburger-menu" title="Menu">
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
            </button>
            <div class="dropdown-menu" id="dropdown-menu">
                <button class="calc-btn-menu" onclick="openCalculator()" title="Máy tính phân số">
                    <img src="https://cdn1.iconfinder.com/data/icons/ios-11-glyphs/30/calculator-1024.png" alt="Calculator">
                    Máy tính
                </button>
                ${isLoggedIn ? `
                    <button class="logout-btn-menu" onclick="handleLogout()">
                        Đăng xuất
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    // Add event listener for hamburger menu
    attachHamburgerListener();
}


// Handle logout
async function handleLogout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        await Auth.logout();
        // Auth.logout() already navigates to login, no need to call it again
    }
}

// Attach hamburger menu listener
function attachHamburgerListener() {
    const hamburgerBtn = document.getElementById('hamburger-menu');
    const dropdownMenu = document.getElementById('dropdown-menu');
    
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            dropdownMenu.classList.toggle('active');
            hamburgerBtn.classList.toggle('active');
        });
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.header-r')) {
            dropdownMenu.classList.remove('active');
            hamburgerBtn.classList.remove('active');
        }
    });
}

// ==================== PAGE RENDERING ====================

// Render Home Page
async function renderHomePage() {
    // Check login - redirect to login if not authenticated
    if (!Auth.requireLogin()) return;
    
    if (AppState.grades.length === 0) {
        await initializeData();
    }
    
    // Load contests - Always ensure they're loaded
    await ContestSystem.init();
    
    console.log('Contests loaded:', ContestSystem.contests);
    
    const user = Auth.getCurrentUser();
    const userCompletedContests = user?.completedContests || [];
    
    // Get active and upcoming contests
    const now = new Date();
    const activeContests = ContestSystem.contests.filter(c => {
        const start = new Date(c.startTime);
        const end = new Date(c.endTime);
        return start <= now && now <= end;
    });
    const upcomingContests = ContestSystem.contests.filter(c => {
        const start = new Date(c.startTime);
        return start > now;
    });
    const allContests = [...activeContests, ...upcomingContests];
    
    console.log('Active contests:', activeContests.length, 'Upcoming:', upcomingContests.length);
    
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div class="container">
            <!-- Section: Exercises & Tests -->
            <section class="exercises-section">
                <h2 class="section-title">Bài Tập & Kiểm Tra</h2>
                <div class="grades-grid" id="grades-grid">
                    ${AppState.grades.map(grade => createGradeCardHTML(grade)).join('')}
                </div>
            </section>
            
            <!-- Section: Contests -->
            <section class="contests-section" style="margin-top: 4rem;">
                <h2 class="section-title">Các Cuộc Thi Đang Diễn Ra</h2>
                <div class="contests-grid" id="contests-grid">
                    ${allContests.length > 0 ? allContests.map(contest => {
                        const isCompleted = userCompletedContests.includes(contest.id);
                        const startTime = new Date(contest.startTime);
                        const endTime = new Date(contest.endTime);
                        const now = new Date();
                        const isActive = startTime <= now && now <= endTime;
                        
                        return createContestCardHTML(contest, isCompleted, isActive);
                    }).join('') : `
                        <div class="empty-contests-container" id="empty-contests-state" style="grid-column: 1/-1; display: flex; align-items: center; justify-content: center; gap: 2rem; padding: 4rem 3rem; color: var(--text-light);">
                            <p style="font-size: 1.6rem; font-weight: 500; color: var(--text-dark); margin: 0; white-space: nowrap;">Hiện chưa có cuộc thi nào</p>
                            <img src="ASSETS/images/icons/cat-sleeping.png" alt="Chủ thỏ" style="width: 75px; height: 75px; object-fit: contain; opacity: 0.8; flex-shrink: 0;">
                        </div>
                    `}
                </div>
            </section>
        </div>
    `;
    
    // Attach contest card listeners
    attachContestCardListeners();
}

function createGradeCardHTML(grade) {
    return `
        <div class="grade-card">
            <h3>${grade.name}</h3>
            <p>${grade.description}</p>
            <p class="exercise-count">Số bài thực hành: ${grade.totalExercises}</p>
            <button class="btn" onclick="navigateTo('grade', '${grade.id}')">
                Bắt đầu học
            </button>
        </div>
    `;
}

// Render Grade Page
async function renderGradePage(params) {
    if (AppState.grades.length === 0) {
        await initializeData();
    }
    
    const gradeId = params.id;
    const grade = AppState.grades.find(g => g.id === gradeId);
    
    if (!grade) {
        showError('Không tìm thấy khối học!');
        return;
    }
    
    const chapters = AppState.chapters.filter(c => grade.chapters.includes(c.id));
    
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div class="container">
            <div class="grade-header">
                <h2>${grade.name}</h2>
                <p>Số bài thực hành: ${grade.totalExercises}</p>
            </div>
            <div class="chapters-grid" id="chapters-grid">
                ${chapters.map(chapter => createChapterCardHTML(chapter)).join('')}
            </div>
            <div class="home-next">
                <button class="btn-home" onclick="navigateTo('home')">Về trang chủ</button>
            </div>
        </div>
    `;
}

function createChapterCardHTML(chapter) {
    return `
        <div class="chapter-card">
            <h2>${chapter.name}</h2>
            <h3>Số câu thực hành: ${chapter.exerciseCount}</h3>
            <button class="btn" onclick="navigateTo('quiz', '${chapter.id}')">
                Bắt đầu làm bài
            </button>
        </div>
    `;
}

// Render Chapter/Quiz Page
async function renderChapterPage(params) {
    // Check login
    if (!Auth.requireLogin()) return;
    
    if (AppState.chapters.length === 0) {
        await initializeData();
    }
    
    const chapterId = params.id;
    const chapter = AppState.chapters.find(c => c.id === chapterId);
    
    if (!chapter) {
        showError('Không tìm thấy chương học!');
        return;
    }
    
    // Redirect to quiz
    navigateTo('quiz', chapterId);
}

// Render Quiz Page
async function renderQuizPage(params) {
    // Check login
    if (!Auth.requireLogin()) return;
    
    // Load data if needed
    if (AppState.questions.length === 0) {
        await initializeData();
    }
    
    const chapterId = params.id;
    
    // Find chapter info
    const chapter = AppState.chapters.find(c => c.id === chapterId);
    if (!chapter) {
        showError('Không tìm thấy chương học!');
        return;
    }
    
    // Get questions for this chapter
    const chapterQuestions = AppState.questions.filter(q => q.chapterId === chapterId);
    
    if (chapterQuestions.length === 0) {
        showError('Chương này chưa có câu hỏi!');
        return;
    }
    
    // Find grade ID for navigation
    const currentUser = Auth.getCurrentUser();
    const userGrade = AppState.grades.find(g => g.chapters.includes(chapterId));
    const gradeId = userGrade ? userGrade.id : null;
    
    // Initialize quiz with shuffled questions and options
    initializeQuiz(chapterQuestions, chapterId, chapter.name, gradeId);
    
    // Render first question
    renderQuestion();
}

// Render Profile Page
function renderProfilePage() {
    // Check login
    if (!Auth.requireLogin()) return;
    
    const user = Auth.getCurrentUser();
    
    if (!user) {
        navigateTo('login');
        return;
    }
    
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div class="container">
            <div class="profile-container">
                <div class="profile-left">
                    <div class="avatar">
                        <img src="${user.avatar}" alt="${user.fullName}">
                    </div>
                </div>
                <div class="profile-right">
                    <h2>${user.fullName}</h2>
                    <p><strong>Tên đăng nhập:</strong> ${user.username}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    ${user.dateOfBirth ? `<p><strong>Ngày sinh:</strong> ${user.dateOfBirth}</p>` : ''}
                    ${user.school ? `<p><strong>Trường:</strong> ${user.school}</p>` : ''}
                    ${user.grade ? `<p><strong>Lớp:</strong> ${user.grade}</p>` : ''}
                    <p><strong>Tham gia:</strong> ${new Date(user.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
            </div>
            
            <div class="chart-container">
                <h3>Tiến độ học tập</h3>
                <div class="chart">
                    ${renderProgressBars(user.progress)}
                </div>
            </div>
            
            <div class="home-next" style="justify-content: center;">
                <button class="btn-home" onclick="navigateTo('home')">Về trang chủ</button>
            </div>
        </div>
    `;
}

function renderProgressBars(progress) {
    const grades = ['grade-7', 'grade-8', 'grade-9'];
    const labels = ['Lớp 7', 'Lớp 8', 'Lớp 9'];
    
    return grades.map((gradeId, index) => {
        const data = progress[gradeId];
        if (!data) return '';
        
        const percentage = data.total > 0 ? (data.completed / data.total * 100) : 0;
        
        return `
            <div class="bar" style="height: ${Math.max(percentage, 10)}%;" title="${labels[index]}: ${data.completed}/${data.total}">
            </div>
        `;
    }).join('');
}

// Render Contest Quiz Page
function renderContestQuizPage(params) {
    // Check login
    if (!Auth.requireLogin()) return;
    
    const contestId = params.id;
    const contestDetails = ContestSystem.getContestDetails(contestId);
    
    if (!contestDetails) {
        showError('Cuộc thi không tồn tại!');
        navigateTo('home');
        return;
    }
    
    const user = Auth.getCurrentUser();
    
    // Check if user already completed
    if (user.completedContests && user.completedContests.includes(contestId)) {
        alert('Bạn đã tham gia cuộc thi này rồi!');
        navigateTo('home');
        return;
    }
    
    const main = document.getElementById('main-content');
    const questions = contestDetails.questionObjects;
    
    main.innerHTML = `
        <div class="contest-quiz-container">
            <div class="contest-quiz-header">
                <div class="quiz-title">
                    <h2>${contestDetails.title}</h2>
                    <p>Câu hỏi: <span id="current-question">1</span>/<span id="total-questions">${questions.length}</span></p>
                </div>
                <div class="quiz-timer">
                    <div class="timer-display" id="timer-display">
                        <span id="timer-minutes">00</span>:<span id="timer-seconds">00</span>
                    </div>
                    <p>Thời gian còn lại</p>
                </div>
            </div>
            
            <div class="contest-quiz-body">
                <div class="progress-container">
                    <div class="progress-bar" id="progress-bar" style="width: 0%;"></div>
                </div>
                
                <div id="quiz-content">
                    <!-- Questions will be rendered here -->
                </div>
            </div>
            
            <div class="contest-quiz-footer">
                <button class="btn-secondary" id="btn-quit-contest" onclick="if(confirm('Bạn có chắc muốn thoát?')) navigateTo('home')">Thoát</button>
                <button class="btn" id="btn-next-question" style="display: none;">Câu Tiếp Theo</button>
                <button class="btn-primary" id="btn-submit-contest" style="display: none;">Nộp Bài</button>
            </div>
        </div>
    `;
    
    // Initialize contest quiz
    initializeContestQuiz(contestDetails, questions);
}

// Initialize contest quiz system
let contestQuizState = {
    currentQuestionIndex: 0,
    answers: [],
    startTime: Date.now(),
    contestDuration: 0
};

function initializeContestQuiz(contest, questions) {
    contestQuizState = {
        currentQuestionIndex: 0,
        answers: new Array(questions.length).fill(null),
        startTime: Date.now(),
        contestDuration: contest.duration * 60 * 1000  // Convert to milliseconds
    };
    
    document.getElementById('total-questions').textContent = questions.length;
    
    // Start timer
    startContestTimer(contest.duration);
    
    // Render first question
    renderContestQuestion(questions, 0);
    
    // Attach listeners
    document.getElementById('btn-next-question').addEventListener('click', () => {
        if (contestQuizState.currentQuestionIndex < questions.length - 1) {
            contestQuizState.currentQuestionIndex++;
            renderContestQuestion(questions, contestQuizState.currentQuestionIndex);
        }
    });
    
    document.getElementById('btn-submit-contest').addEventListener('click', () => {
        submitContestAnswers(contest, questions);
    });
}

function renderContestQuestion(questions, index) {
    const question = questions[index];
    const quizContent = document.getElementById('quiz-content');
    const currentBtn = document.getElementById('btn-next-question');
    const submitBtn = document.getElementById('btn-submit-contest');
    
    document.getElementById('current-question').textContent = index + 1;
    
    // Update progress bar
    const progress = ((index + 1) / questions.length) * 100;
    document.getElementById('progress-bar').style.width = progress + '%';
    
    let questionHTML = `
        <div class="question-box">
            <h3>${question.question}</h3>
    `;
    
    if (question.type === 'multiple-choice' || question.type === 'calculation') {
        questionHTML += `
            <div class="options-list">
                ${question.options.map((option, idx) => `
                    <label class="option-item">
                        <input 
                            type="radio" 
                            name="answer" 
                            value="${idx}"
                            ${contestQuizState.answers[index] === idx ? 'checked' : ''}
                            onchange="contestQuizState.answers[${index}] = ${idx}; updateProgress();"
                        >
                        <span class="option-text">${option}</span>
                    </label>
                `).join('')}
            </div>
        `;
        
        if (question.explanation) {
            questionHTML += `<p class="explanation" style="display: none;"><strong>Giải thích:</strong> ${question.explanation}</p>`;
        }
    }
    
    questionHTML += '</div>';
    quizContent.innerHTML = questionHTML;
    
    // Update button states
    if (index === questions.length - 1) {
        currentBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    } else {
        currentBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    }
}

function startContestTimer(durationMinutes) {
    const duration = parseInt(durationMinutes) * 60;
    let timeRemaining = duration;
    
    const timerInterval = setInterval(() => {
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            alert('Hết thời gian làm bài!');
            submitContestAnswers(ContestSystem.contests.find(c => c.id === contestQuizState.contestId), 
                                 ContestSystem.questions);
            return;
        }
        
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        
        const timerMinutesEl = document.getElementById('timer-minutes');
        const timerSecondsEl = document.getElementById('timer-seconds');
        
        if (timerMinutesEl) timerMinutesEl.textContent = String(minutes).padStart(2, '0');
        if (timerSecondsEl) timerSecondsEl.textContent = String(seconds).padStart(2, '0');
        
        // Change color to red if less than 1 minute
        const timerDisplay = document.getElementById('timer-display');
        if (timeRemaining < 60 && timerDisplay) {
            timerDisplay.style.color = '#f44336';
        }
        
        timeRemaining--;
    }, 1000);
}

function submitContestAnswers(contest, questions) {
    // Prepare answers
    const answers = contestQuizState.answers.map((answer, idx) => ({
        questionId: questions[idx].id,
        answer: answer
    }));
    
    // Submit through ContestSystem
    const result = ContestSystem.submitContest(contest.id, answers);
    
    if (result.success) {
        // Go to result page
        sessionStorage.setItem('contestResult', JSON.stringify(result.result));
        sessionStorage.setItem('contestId', contest.id);
        navigateTo('contest-result', contest.id);
    } else {
        alert(result.message);
    }
}

function updateProgress() {
    // Update when answers change
}

// Render Contest Result Page
function renderContestResultPage(params) {
    const contestId = params.id;
    const resultStr = sessionStorage.getItem('contestResult');
    const result = resultStr ? JSON.parse(resultStr) : null;
    
    if (!result) {
        showError('Không tìm thấy kết quả bài thi!');
        navigateTo('home');
        return;
    }
    
    const main = document.getElementById('main-content');
    
    main.innerHTML = `
        <div class="contest-result-container">
            <div class="result-header">
                <h2>Kết Quả Bài Thi</h2>
                <p style="color: var(--text-light); margin-top: 1rem;">Cuộc thi đã được nộp thành công</p>
            </div>
            
            <div class="result-content">
                <div class="result-card">
                    <div class="result-item">
                        <label>Điểm</label>
                        <div class="result-value" style="font-size: 3.6rem; color: var(--primary);">
                            ${result.score}%
                        </div>
                    </div>
                    
                    <div class="result-item">
                        <label>Câu Hỏi Đúng</label>
                        <div class="result-value">
                            <strong>${result.correctAnswers}</strong> / ${result.totalQuestions} câu
                        </div>
                    </div>
                    
                    <div class="result-divider"></div>
                    
                    <div class="result-item elo-gain">
                        <label>ELO Được Cộng</label>
                        <div class="result-value elo-positive">
                            +${result.eloChange}
                        </div>
                    </div>
                    
                    <div class="result-item">
                        <label>ELO Hiện Tại</label>
                        <div class="result-value" style="font-size: 2.4rem;">
                            <strong>${result.finalElo}</strong>
                        </div>
                        <p style="color: var(--text-light); font-size: 1.2rem; margin-top: 0.5rem;">
                            Trước: ${result.oldElo}
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="result-footer">
                <button class="btn-primary btn-large" onclick="navigateTo('home')">
                    Về Trang Chủ
                </button>
            </div>
        </div>
    `;
    
    // Clear session storage
    sessionStorage.removeItem('contestResult');
    sessionStorage.removeItem('contestId');
}

// Render Profile Page
function renderProfilePage(params) {
    if (!Auth.requireLogin()) return;
    
    const user = Auth.getCurrentUser();
    const main = document.getElementById('main-content');
    
    main.innerHTML = `
        <div class="container">
            <div class="profile-section">
                <div class="profile-header">
                    <img src="${user.avatar || 'https://via.placeholder.com/150'}" alt="Avatar" class="profile-avatar">
                    <div class="profile-info">
                        <h2>${user.fullName}</h2>
                        <p>@${user.username}</p>
                        <p class="email">${user.email}</p>
                    </div>
                </div>
                
                <div class="profile-details">
                    <div class="detail-item">
                        <label>Trường:</label>
                        <span>${user.school || 'Chưa cập nhật'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Lớp:</label>
                        <span>${user.grade || 'Chưa cập nhật'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Ngày Sinh:</label>
                        <span>${user.dateOfBirth || 'Chưa cập nhật'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Studying Points:</label>
                        <span class="sp-badge">${user.studyingPoints || 1000}</span>
                    </div>
                </div>
                
                <div class="profile-footer">
                    <button class="btn" onclick="openMyProfileModal()">📊 Xem Biểu Đồ</button>
                    <button class="btn" onclick="navigateTo('home')">Về trang chủ</button>
                </div>
            </div>
        </div>
    `;
}

// Render Submit/Result Page
function renderSubmitPage() {
    // Check login
    if (!Auth.requireLogin()) return;
    
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div class="container">
            <div class="result-box">
                <h2>Kết quả bài làm</h2>
                <div class="score">
                    Bạn trả lời đúng: <strong id="correct">N/A</strong>/<strong id="total">N/A</strong> câu
                </div>
                <div class="score">
                    Điểm của bạn: <strong id="score">N/A</strong>
                </div>
                <div class="home-next">
                    <button class="btn-home" onclick="navigateTo('home')">Về trang chủ</button>
                    <button class="btn-next" onclick="navigateTo('home')">Làm bài tiếp theo</button>
                </div>
            </div>
        </div>
    `;
}

function createContestCardHTML(contest, isCompleted, isActive) {
    const startTime = new Date(contest.startTime);
    const endTime = new Date(contest.endTime);
    const now = new Date();
    
    // Calculate time remaining
    let timeRemaining = '';
    let timeStatus = 'ended';
    
    if (isActive) {
        const diff = endTime - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        timeRemaining = `${hours}h ${minutes}m còn lại`;
        timeStatus = 'active';
    } else if (startTime > now) {
        const diff = startTime - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        timeRemaining = `Bắt đầu trong ${days}d ${hours}h`;
        timeStatus = 'upcoming';
    } else {
        timeRemaining = 'Đã kết thúc';
        timeStatus = 'ended';
    }
    
    const buttonClass = isCompleted ? 'btn-locked' : (isActive ? 'btn-primary' : 'btn-secondary');
    const buttonIcon = isCompleted ? '<i class="fas fa-check-circle"></i>' : (isActive ? '<i class="fas fa-play"></i>' : '<i class="fas fa-hourglass"></i>');
    const buttonText = isCompleted ? 'Đã Tham Gia' : (isActive ? 'Tham Gia Ngay' : 'Chưa Diễn Ra');
    const isDisabled = isCompleted || !isActive;
    
    // Format start and end time
    const startTimeFormatted = startTime.toLocaleString('vi-VN');
    const endTimeFormatted = endTime.toLocaleString('vi-VN');
    
    return `
        <div class="contest-card ${isCompleted ? 'completed' : ''} ${timeStatus}">
            <div class="contest-header">
                <h3 class="contest-title">${contest.title}</h3>
                <span class="contest-status ${isActive ? 'active' : 'upcoming'}">
                    ${isActive ? '🔴 Đang diễn ra' : '⏰ Sắp diễn ra'}
                </span>
            </div>
            
            <p class="contest-description">${contest.description}</p>
            
            <div class="contest-info">
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <span><strong>${contest.duration}</strong> phút</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-question-circle"></i>
                    <span><strong>${contest.totalQuestions}</strong> câu</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-users"></i>
                    <span><strong>${contest.participants.length}</strong> người tham gia</span>
                </div>
            </div>
            
            <div class="contest-details">
                <div class="detail-row">
                    <span class="detail-label">📅 Bắt đầu:</span>
                    <span class="detail-value">${startTimeFormatted}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🏁 Kết thúc:</span>
                    <span class="detail-value">${endTimeFormatted}</span>
                </div>
            </div>
            
            <div class="contest-timer ${timeStatus}">
                <span>${timeRemaining}</span>
            </div>
            
            <button 
                class="${buttonClass}" 
                onclick="${isDisabled ? 'return false;' : `navigateTo('contest', '${contest.id}')`}"
                ${isDisabled ? 'disabled style="opacity: 0.6; cursor: not-allowed;"' : ''}
                title="${isCompleted ? 'Bạn đã tham gia cuộc thi này' : isActive ? 'Bấm để tham gia' : 'Cuộc thi chưa bắt đầu'}"
            >
                ${buttonIcon} ${buttonText}
            </button>
        </div>
    `;
}

function attachContestCardListeners() {
    // Timers sẽ được cập nhật mỗi giây
    setInterval(() => {
        const contestCards = document.querySelectorAll('.contest-timer');
        contestCards.forEach(card => {
            // Update timers if needed
        });
    }, 1000);
}

function showError(message) {
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div class="container">
            <div class="error-message">
                <h2>❌ Lỗi</h2>
                <p>${message}</p>
                <button class="btn" onclick="navigateTo('home')" style="margin-top: 20px;">
                    Về trang chủ
                </button>
            </div>
        </div>
    `;
}

function showLoading() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div class="loading">
            <p>Đang tải...</p>
        </div>
    `;
}

// ==================== PROFILE MODAL WITH CHARTS ====================

function openMyProfileModal() {
    const modal = document.getElementById('user-profile-modal');
    const user = Auth.getCurrentUser();
    
    if (!user) return;

    // Set user info
    document.getElementById('my-profile-avatar').src = user.avatar;
    document.getElementById('my-profile-fullname').textContent = user.fullName;
    document.getElementById('my-profile-email').textContent = '📧 ' + user.email;
    document.getElementById('my-profile-school').textContent = '🏢 ' + (user.school || 'Không rõ');
    document.getElementById('my-profile-points').textContent = '⭐ ' + user.studyingPoints + ' điểm';

    modal.style.display = 'flex';

    // Render charts with a small delay to ensure DOM is ready
    setTimeout(() => {
        renderMyProgressChart(user);
        renderMyScoresChart(user);
    }, 100);
}

function renderMyProgressChart(user) {
    const ctx = document.getElementById('myProgressChart');
    if (!ctx) return;

    // Destroy existing chart if any
    if (window.myProgressChart) window.myProgressChart.destroy();

    // Get progress data from user
    const progressData = user.progress || {};
    const labels = Object.keys(progressData);
    
    window.myProgressChart = new Chart(ctx, {
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
                        color: getComputedStyle(document.documentElement).getPropertyValue('--admin-text-secondary') || '#7f8c8d'
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--admin-border') || '#e0e6ed'
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--admin-text-secondary') || '#7f8c8d'
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--admin-border') || '#e0e6ed'
                    }
                }
            }
        }
    });
}

function renderMyScoresChart(user) {
    const ctx = document.getElementById('myScoresChart');
    if (!ctx) return;

    // Destroy existing chart if any
    if (window.myScoresChart) window.myScoresChart.destroy();

    // Get scores from user progress
    const progressData = user.progress || {};
    const gradeLabels = [];
    const allScores = [];

    Object.entries(progressData).forEach(([gradeKey, gradeProgress]) => {
        const scores = gradeProgress.scores || [];
        scores.forEach((score, idx) => {
            gradeLabels.push(`${gradeKey === 'grade-7' ? 'Lớp 7' : gradeKey === 'grade-8' ? 'Lớp 8' : 'Lớp 9'} - BT${idx + 1}`);
            allScores.push(score);
        });
    });

    window.myScoresChart = new Chart(ctx, {
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
                        color: getComputedStyle(document.documentElement).getPropertyValue('--admin-text-secondary') || '#7f8c8d'
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--admin-border') || '#e0e6ed'
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--admin-text-secondary') || '#7f8c8d'
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--admin-border') || '#e0e6ed'
                    }
                }
            }
        }
    });
}

function closeMyProfileModal() {
    document.getElementById('user-profile-modal').style.display = 'none';
}

// ==================== LOGIN & SIGNUP PAGES ====================

function renderLoginPage() {
    const mainContent = document.getElementById('main-content');
    const appHeader = document.getElementById('app-header');
    const appFooter = document.getElementById('app-footer');
    
    // Hide header and footer
    appHeader.style.display = 'none';
    appFooter.style.display = 'none';
    
    mainContent.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h2>Đăng Nhập</h2>
                    <p>Chào mừng trở lại! Vui lòng nhập email và mật khẩu.</p>
                </div>
                
                <form id="login-form" class="auth-form">
                    <div class="form-group">
                        <label for="login-email">Email</label>
                        <input 
                            type="email" 
                            id="login-email" 
                            name="email" 
                            placeholder="Nhập email của bạn"
                            required
                        >
                    </div>
                    
                    <div class="form-group">
                        <label for="login-password">Mật khẩu</label>
                        <div class="password-input-wrapper">
                            <input 
                                type="password" 
                                id="login-password" 
                                name="password" 
                                placeholder="Nhập mật khẩu"
                                required
                            >
                            <button 
                                type="button" 
                                class="toggle-password-btn"
                                onclick="togglePasswordVisibility('login-password')"
                            >
                                <span class="eye-icon">👁️</span>
                            </button>
                        </div>
                    </div>
                    
                    <button type="submit" class="auth-submit-btn">ĐĂNG NHẬP</button>
                    
                    <div class="auth-footer">
                        <p>Chưa có tài khoản? <a href="#" onclick="navigateTo('signup'); return false;">Đăng ký ngay</a></p>
                    </div>
                </form>
                
                <div id="login-message" class="auth-message" style="display: none;"></div>
            </div>
        </div>
    `;
    
    // Attach login form listener
    document.getElementById('login-form').addEventListener('submit', handleLoginSubmit);
}

function renderSignupPage() {
    const mainContent = document.getElementById('main-content');
    const appHeader = document.getElementById('app-header');
    const appFooter = document.getElementById('app-footer');
    
    // Hide header and footer
    appHeader.style.display = 'none';
    appFooter.style.display = 'none';
    
    mainContent.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h2>Đăng Ký</h2>
                    <p>Tạo tài khoản mới để bắt đầu học tập.</p>
                </div>
                
                <form id="signup-form" class="auth-form">
                    <div class="form-group">
                        <label for="signup-email">Email</label>
                        <input 
                            type="email" 
                            id="signup-email" 
                            name="email" 
                            placeholder="Nhập email của bạn"
                            required
                        >
                    </div>
                    
                    <div class="form-group">
                        <label for="signup-password">Mật khẩu</label>
                        <div class="password-input-wrapper">
                            <input 
                                type="password" 
                                id="signup-password" 
                                name="password" 
                                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                                required
                            >
                            <button 
                                type="button" 
                                class="toggle-password-btn"
                                onclick="togglePasswordVisibility('signup-password')"
                            >
                                <span class="eye-icon">👁️</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="signup-confirm-password">Xác Nhận Mật Khẩu</label>
                        <div class="password-input-wrapper">
                            <input 
                                type="password" 
                                id="signup-confirm-password" 
                                name="confirmPassword" 
                                placeholder="Nhập lại mật khẩu"
                                required
                            >
                            <button 
                                type="button" 
                                class="toggle-password-btn"
                                onclick="togglePasswordVisibility('signup-confirm-password')"
                            >
                                <span class="eye-icon">👁️</span>
                            </button>
                        </div>
                    </div>
                    
                    <button type="submit" class="auth-submit-btn">ĐĂNG KÝ</button>
                    
                    <div class="auth-footer">
                        <p>Đã có tài khoản? <a href="#" onclick="navigateTo('login'); return false;">Đăng nhập</a></p>
                    </div>
                </form>
                
                <div id="signup-message" class="auth-message" style="display: none;"></div>
            </div>
        </div>
    `;
    
    // Attach signup form listener
    document.getElementById('signup-form').addEventListener('submit', handleSignupSubmit);
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const messageDiv = document.getElementById('login-message');
    
    // Show loading
    messageDiv.textContent = 'Đang đăng nhập...';
    messageDiv.style.display = 'block';
    messageDiv.className = 'auth-message auth-message-loading';
    
    // Call Auth.login
    const result = await Auth.login(email, password);
    
    if (result.success) {
        messageDiv.textContent = 'Đăng nhập thành công!';
        messageDiv.className = 'auth-message auth-message-success';
        
        setTimeout(() => {
            // Render header for authenticated user
            renderHeader();
            
            // Handle different user roles
            const user = Auth.getCurrentUser();
            if (user && user.role === 'admin') {
                // Admin: Open admin.html in new tab
                const adminWindow = window.open('admin.html', '_blank', 'width=1400,height=900');
                if (adminWindow) {
                    window.adminTabWindow = adminWindow;
                }
            } else if (user && user.role === 'reviewer') {
                // Reviewer: Open admin.html in new tab
                const reviewerWindow = window.open('admin.html', '_blank', 'width=1400,height=900');
                if (reviewerWindow) {
                    window.reviewerTabWindow = reviewerWindow;
                }
            }
            
            // Navigate to home
            navigateTo('home');
        }, 800);
    } else {
        messageDiv.textContent = result.message;
        messageDiv.className = 'auth-message auth-message-error';
    }
}

async function handleSignupSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const messageDiv = document.getElementById('signup-message');
    
    // Client-side validation
    if (!email || !password || !confirmPassword) {
        messageDiv.textContent = 'Vui lòng nhập đầy đủ thông tin!';
        messageDiv.className = 'auth-message auth-message-error';
        messageDiv.style.display = 'block';
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        messageDiv.textContent = 'Email không hợp lệ!';
        messageDiv.className = 'auth-message auth-message-error';
        messageDiv.style.display = 'block';
        return;
    }
    
    if (password.length < 6) {
        messageDiv.textContent = 'Mật khẩu phải có ít nhất 6 ký tự!';
        messageDiv.className = 'auth-message auth-message-error';
        messageDiv.style.display = 'block';
        return;
    }
    
    if (password !== confirmPassword) {
        messageDiv.textContent = 'Mật khẩu xác nhận không khớp!';
        messageDiv.className = 'auth-message auth-message-error';
        messageDiv.style.display = 'block';
        return;
    }
    
    // Show loading
    messageDiv.textContent = 'Đang đăng ký...';
    messageDiv.style.display = 'block';
    messageDiv.className = 'auth-message auth-message-loading';
    
    // Create username from email (part before @)
    const username = email.split('@')[0];
    
    // Call Auth.signup
    const result = await Auth.signup({
        username,
        email,
        password,
        confirmPassword,
        fullName: username
    });
    
    if (result.success) {
        messageDiv.textContent = 'Đăng ký thành công! Đang chuyển hướng...';
        messageDiv.className = 'auth-message auth-message-success';
        setTimeout(() => {
            // Render header for authenticated user
            renderHeader();
            // Navigate to home
            navigateTo('home');
        }, 800);
    } else {
        messageDiv.textContent = result.message;
        messageDiv.className = 'auth-message auth-message-error';
    }
}

// ==================== INITIALIZATION ====================

// Initialize app
async function initApp() {
    showLoading();
    
    // Initialize Auth - MUST be first
    await Auth.init();
    
    // Load initial data
    await initializeData();
    
    // Render header
    renderHeader();
    
    // Setup modal close listeners
    const userProfileModal = document.getElementById('user-profile-modal');
    const closeBtn = document.getElementById('user-profile-modal-close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeMyProfileModal);
    }
    
    if (userProfileModal) {
        userProfileModal.addEventListener('click', (e) => {
            if (e.target === userProfileModal) {
                closeMyProfileModal();
            }
        });
    }
    
    // Initialize router AFTER auth is ready
    Router.init();
}

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);