// MathAir Contest Taking Interface
// Includes: Timer, Question Tracker, Answer Management, Results & Leaderboard

const ContestTaking = {
    contestId: null,
    contest: null,
    currentQuestionIndex: 0,
    answers: {},
    startTime: null,
    endTime: null,
    timerInterval: null,
    scrolledQuestions: new Set(), // Track questions user has scrolled past
    
    /**
     * Initialize contest taking
     */
    async init(contestId) {
        try {
            this.contestId = contestId;
            
            // Ensure contest system is initialized
            if (!window.ContestSystem) {
                console.error('ContestSystem not initialized');
                return false;
            }
            
            await window.ContestSystem.init();
            
            this.contest = window.ContestSystem.getContestDetails(contestId);
            if (!this.contest) {
                alert('Cuộc thi không tồn tại');
                return false;
            }
            
            // Check if user already completed this contest
            const user = window.Auth?.getCurrentUser();
            if (!user) {
                alert('Vui lòng đăng nhập');
                return false;
            }
            
            if (window.ContestSystem.hasUserCompletedContest(user.id, contestId)) {
                alert('Bạn đã tham gia cuộc thi này rồi!');
                return false;
            }
            
            this.answers = {};
            this.currentQuestionIndex = 0;
            this.startTime = new Date();
            this.endTime = new Date(this.startTime.getTime() + this.contest.duration * 60000);
            
            this.render();
            this.startTimer();
            
            return true;
        } catch (error) {
            console.error('Error initializing contest:', error);
            alert('Lỗi: ' + error.message);
            return false;
        }
    },
    
    /**
     * Render the contest taking interface
     */
    render() {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="contest-taking-container">
                <!-- Timer & Question Tracker (Top Right) -->
                <div class="contest-header-bar">
                    <div class="contest-title">
                        <h1>${this.contest.title}</h1>
                        <p>${this.contest.description}</p>
                    </div>
                    <div class="contest-timer-section">
                        <div class="timer-display" id="contest-timer">
                            <i class="fas fa-hourglass-end"></i>
                            <span id="timer-text">--:--:--</span>
                        </div>
                    </div>
                </div>

                <!-- Main Content Area -->
                <div class="contest-content-wrapper">
                    <!-- Left: Questions -->
                    <div class="contest-main-area">
                        <div class="question-area" id="question-area">
                            <!-- Questions rendered here -->
                        </div>
                        
                        <!-- Navigation Buttons -->
                        <div class="contest-nav-buttons">
                            <button class="btn btn-secondary" id="prev-btn" onclick="ContestTaking.previousQuestion()">
                                <i class="fas fa-arrow-left"></i> Câu Trước
                            </button>
                            <button class="btn btn-secondary" id="next-btn" onclick="ContestTaking.nextQuestion()">
                                Câu Tiếp <i class="fas fa-arrow-right"></i>
                            </button>
                            <button class="btn btn-danger" id="submit-btn" onclick="ContestTaking.checkAndSubmit()">
                                <i class="fas fa-check"></i> Nộp Bài
                            </button>
                        </div>
                    </div>

                    <!-- Right: Question Tracker -->
                    <div class="contest-tracker-section">
                        <div class="tracker-header">
                            <h3>Danh Sách Câu Hỏi</h3>
                            <div class="tracker-legend">
                                <div class="legend-item">
                                    <span class="question-indicator answered"></span> Đã trả lời
                                </div>
                                <div class="legend-item">
                                    <span class="question-indicator skipped"></span> Chưa trả lời
                                </div>
                                <div class="legend-item">
                                    <span class="question-indicator unanswered"></span> Chưa xem
                                </div>
                            </div>
                        </div>
                        <div class="tracker-grid" id="question-tracker">
                            <!-- Question tracker items rendered here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.renderQuestion();
        this.renderQuestionTracker();
        this.updateNavigationButtons();
    },
    
    /**
     * Render current question
     */
    renderQuestion() {
        const questionArea = document.getElementById('question-area');
        if (!questionArea || !this.contest.questionObjects || this.contest.questionObjects.length === 0) {
            return;
        }
        
        const question = this.contest.questionObjects[this.currentQuestionIndex];
        if (!question) return;
        
        const answer = this.answers[question.id] || null;
        
        let questionHTML = `
            <div class="question-container">
                <div class="question-number">
                    Câu ${this.currentQuestionIndex + 1}/${this.contest.totalQuestions}
                </div>
                <div class="question-text">
                    ${question.question}
                </div>
        `;
        
        if (question.type === 'multiple-choice') {
            questionHTML += `
                <div class="question-options">
            `;
            question.options.forEach((option, index) => {
                const isSelected = answer === index;
                questionHTML += `
                    <label class="option-label">
                        <input type="radio" name="answer" value="${index}" 
                               ${isSelected ? 'checked' : ''}
                               onchange="ContestTaking.saveAnswer('${question.id}', ${index})">
                        <span class="option-text">${option}</span>
                    </label>
                `;
            });
            questionHTML += `
                </div>
            `;
        } else if (question.type === 'calculation' || question.type === 'text-input') {
            questionHTML += `
                <div class="question-input">
                    <input type="text" id="text-answer" placeholder="Nhập câu trả lời của bạn"
                           value="${answer || ''}"
                           onchange="ContestTaking.saveAnswer('${question.id}', this.value)">
                </div>
            `;
        } else if (question.type === 'essay') {
            questionHTML += `
                <div class="essay-input-group">
                    <textarea 
                        id="essay-answer" 
                        class="essay-textarea" 
                        placeholder="Viết câu trả lời của bạn ở đây... (Không bắt buộc phải trả lời)"
                        rows="8"
                        onchange="ContestTaking.saveAnswer('${question.id}', this.value)"
                    >${answer || ''}</textarea>
                    <div class="essay-char-count">
                        <span id="char-count">${(answer || '').length}</span>/2000 ký tự
                    </div>
                </div>
            `;
        }
        
        questionHTML += `
            </div>
        `;
        
        questionArea.innerHTML = questionHTML;
        
        // Add character count listener for essay
        if (question.type === 'essay') {
            const essayTextarea = document.getElementById('essay-answer');
            const charCount = document.getElementById('char-count');
            
            if (essayTextarea && charCount) {
                essayTextarea.addEventListener('input', (e) => {
                    charCount.textContent = e.target.value.length;
                });
            }
        }
    },
    
    /**
     * Render question tracker (5 per row)
     */
    renderQuestionTracker() {
        const trackerContainer = document.getElementById('question-tracker');
        if (!trackerContainer) return;
        
        let trackerHTML = '';
        
        const questions = this.contest.questionObjects || [];
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            const isAnswered = this.answers[question.id] !== undefined && this.answers[question.id] !== null && this.answers[question.id] !== '';
            const isScrolled = this.scrolledQuestions.has(question.id);
            const isCurrent = i === this.currentQuestionIndex;
            
            let statusClass = 'unanswered';
            if (isAnswered) {
                statusClass = 'answered';
            } else if (isScrolled) {
                statusClass = 'skipped';
            }
            
            trackerHTML += `
                <button class="question-indicator ${statusClass} ${isCurrent ? 'active' : ''}" 
                        onclick="ContestTaking.goToQuestion(${i})"
                        title="Câu ${i + 1}">
                    ${i + 1}
                </button>
            `;
        }
        
        trackerContainer.innerHTML = trackerHTML;
    },
    
    /**
     * Save answer
     */
    saveAnswer(questionId, answer) {
        this.answers[questionId] = answer;
        this.renderQuestionTracker();
    },
    
    /**
     * Navigate to question
     */
    goToQuestion(index) {
        this.currentQuestionIndex = index;
        this.scrolledQuestions.add(this.contest.questionObjects[index].id);
        this.render();
    },
    
    /**
     * Previous question
     */
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.render();
        }
    },
    
    /**
     * Next question
     */
    nextQuestion() {
        if (this.currentQuestionIndex < this.contest.totalQuestions - 1) {
            this.currentQuestionIndex++;
            this.scrolledQuestions.add(this.contest.questionObjects[this.currentQuestionIndex].id);
            this.render();
        }
    },
    
    /**
     * Update navigation buttons state
     */
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentQuestionIndex === 0;
        }
        if (nextBtn) {
            nextBtn.disabled = this.currentQuestionIndex === this.contest.totalQuestions - 1;
        }
    },
    
    /**
     * Check all questions answered before submission
     */
    checkAndSubmit() {
        // Check if all questions are answered
        const unansweredQuestions = [];
        
        this.contest.questionObjects.forEach((question, index) => {
            const answer = this.answers[question.id];
            if (answer === undefined || answer === null || answer === '') {
                unansweredQuestions.push(index + 1);
            }
        });
        
        if (unansweredQuestions.length > 0) {
            alert(`Bạn chưa trả lời các câu hỏi: ${unansweredQuestions.join(', ')}\n\nVui lòng trả lời tất cả các câu trước khi nộp bài!`);
            return;
        }
        
        if (confirm('Bạn có chắc muốn nộp bài? Sau khi nộp sẽ không thể sửa lại!')) {
            this.submitContest();
        }
    },
    
    /**
     * Submit contest
     */
    submitContest() {
        try {
            // Prepare answers array
            const answersArray = [];
            this.contest.questionObjects.forEach(question => {
                answersArray.push({
                    questionId: question.id,
                    answer: this.answers[question.id]
                });
            });
            
            // Calculate time taken
            const timeTaken = Math.floor((new Date() - this.startTime) / 1000); // in seconds
            
            // Submit via ContestSystem
            const result = window.ContestSystem.submitContest(this.contestId, answersArray, timeTaken);
            
            if (result.success) {
                this.stopTimer();
                this.showResults(result.result);
            } else {
                alert('Lỗi: ' + result.message);
            }
        } catch (error) {
            console.error('Error submitting contest:', error);
            alert('Lỗi: ' + error.message);
        }
    },
    
    /**
     * Show results page
     */
    showResults(result) {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        const timeString = this.formatSeconds(result.timeTaken || 0);
        const scorePercentage = result.score || 0;
        const spPoints = result.pointsGained || 0;
        const essayCount = result.essayCount || 0;
        
        let scoreLevel = '';
        if (scorePercentage >= 90) {
            scoreLevel = '🌟 Xuất Sắc';
        } else if (scorePercentage >= 80) {
            scoreLevel = '⭐ Giỏi';
        } else if (scorePercentage >= 70) {
            scoreLevel = '✓ Khá';
        } else {
            scoreLevel = 'Cần Cố Gắng';
        }
        
        let totalQuestionsText = `${result.totalQuestions} câu`;
        if (essayCount > 0) {
            totalQuestionsText += ` (+ ${essayCount} câu tự luận)`;
        }
        
        mainContent.innerHTML = `
            <div class="contest-results-container">
                <div class="results-header">
                    <h1>Bài Làm Của Bạn Đã Được Nộp!</h1>
                    <p>Cảm ơn bạn đã tham gia cuộc thi <strong>${this.contest.title}</strong></p>
                </div>

                <div class="results-content">
                    <div class="results-main">
                        <div class="results-score-box">
                            <div class="score-circle">
                                <span class="score-percentage">${scorePercentage}%</span>
                                <span class="score-label">${scoreLevel}</span>
                            </div>
                            <div class="score-details">
                                <div class="detail-item">
                                    <span class="detail-label">Số Câu Đúng</span>
                                    <span class="detail-value">${result.correctAnswers}/${result.totalQuestions}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Thời Gian Làm Bài</span>
                                    <span class="detail-value">${timeString}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Điểm SP Nhận Được</span>
                                    <span class="detail-value points-gained">+${spPoints}</span>
                                </div>
                            </div>
                        </div>

                        <div class="results-statistics">
                            <h3>Thống Kê Chi Tiết</h3>
                            <div class="stat-bar">
                                <div class="stat-label">Tỷ Lệ Đúng</div>
                                <div class="stat-progress">
                                    <div class="progress-bar success" style="width: ${scorePercentage}%"></div>
                                </div>
                                <div class="stat-value">${result.correctAnswers}/${result.totalQuestions}</div>
                            </div>
                            ${essayCount > 0 ? `
                            <div class="stat-bar">
                                <div class="stat-label">Câu Tự Luận (Chờ Chấm)</div>
                                <div class="stat-progress">
                                    <div class="progress-bar essay" style="width: 50%"></div>
                                </div>
                                <div class="stat-value">${essayCount} câu</div>
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="results-actions">
                        <button class="btn btn-primary" onclick="ContestTaking.showLeaderboard()">
                            <i class="fas fa-trophy"></i> Xem Xếp Hạng
                        </button>
                        <button class="btn btn-secondary" onclick="window.location.href='index.html'">
                            <i class="fas fa-home"></i> Về Trang Chủ
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Show leaderboard
     */
    async showLeaderboard() {
        try {
            const results = this.contest.results || [];
            const users = {};
            
            // Load all users for name lookup
            try {
                const usersResp = await fetch('DATA/users.json');
                if (usersResp.ok) {
                    const usersData = await usersResp.json();
                    usersData.users?.forEach(user => {
                        users[user.id] = user;
                    });
                }
            } catch (e) {
                console.warn('Could not load users data');
            }
            
            // Sort results by score (descending)
            const sortedResults = results.sort((a, b) => b.score - a.score);
            
            const mainContent = document.getElementById('main-content');
            if (!mainContent) return;
            
            let leaderboardHTML = `
                <div class="leaderboard-container">
                    <div class="leaderboard-header">
                        <h1>🏆 Xếp Hạng Cuộc Thi</h1>
                        <p>${this.contest.title}</p>
                    </div>

                    <div class="leaderboard-wrapper">
                        <table class="leaderboard-table">
                            <thead>
                                <tr>
                                    <th class="rank-col">Xếp Hạng</th>
                                    <th class="name-col">Họ Tên / Email</th>
                                    <th class="score-col">Điểm (%)</th>
                                    <th class="answer-col">Đúng/Tổng</th>
                                    <th class="points-col">Điểm SP</th>
                                    <th class="time-col">Thời Gian</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            sortedResults.forEach((result, index) => {
                const user = users[result.userId];
                const userName = user ? (user.username || user.name || user.email) : `User ${result.userId}`;
                const rankMedal = index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : `#${index + 1}`));
                const timeString = result.timeTaken ? this.formatSeconds(result.timeTaken) : '--:--';
                const pointsGained = result.pointsGained || 0;
                
                leaderboardHTML += `
                    <tr class="leaderboard-row ${index < 3 ? 'top-rank' : ''}">
                        <td class="rank-cell">${rankMedal}</td>
                        <td class="name-cell">${userName}</td>
                        <td class="score-cell"><strong>${result.score}%</strong></td>
                        <td class="answer-cell">${result.correctAnswers}/${result.totalQuestions}</td>
                        <td class="points-cell"><span class="sp-badge">+${pointsGained}</span></td>
                        <td class="time-cell">${timeString}</td>
                    </tr>
                `;
            });
            
            leaderboardHTML += `
                            </tbody>
                        </table>
                    </div>

                    <div class="leaderboard-actions">
                        <button class="btn btn-secondary" onclick="window.location.href='index.html'">
                            <i class="fas fa-home"></i> Về Trang Chủ
                        </button>
                    </div>
                </div>
            `;
            
            mainContent.innerHTML = leaderboardHTML;
        } catch (error) {
            console.error('Error showing leaderboard:', error);
            alert('Lỗi: ' + error.message);
        }
    },
    
    /**
     * Start timer
     */
    startTimer() {
        this.timerInterval = setInterval(() => {
            const now = new Date();
            const timeLeft = this.endTime - now;
            
            if (timeLeft <= 0) {
                this.stopTimer();
                alert('Hết thời gian! Bài làm sẽ được nộp tự động.');
                this.submitContest();
                return;
            }
            
            const hours = Math.floor(timeLeft / 3600000);
            const minutes = Math.floor((timeLeft % 3600000) / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            
            const timerText = document.getElementById('timer-text');
            if (timerText) {
                timerText.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
            
            // Change color when time is running out
            const timerDisplay = document.getElementById('contest-timer');
            if (timerDisplay) {
                if (timeLeft < 60000) { // Less than 1 minute
                    timerDisplay.classList.add('running-out');
                } else {
                    timerDisplay.classList.remove('running-out');
                }
            }
        }, 1000);
        
        // Call once immediately
        const now = new Date();
        const timeLeft = this.endTime - now;
        const hours = Math.floor(timeLeft / 3600000);
        const minutes = Math.floor((timeLeft % 3600000) / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        const timerText = document.getElementById('timer-text');
        if (timerText) {
            timerText.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    },
    
    /**
     * Stop timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },
    
    /**
     * Format seconds to HH:MM:SS
     */
    formatSeconds(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours} giờ ${minutes} phút ${secs} giây`;
        } else if (minutes > 0) {
            return `${minutes} phút ${secs} giây`;
        } else {
            return `${secs} giây`;
        }
    }
};

// Make globally available
window.ContestTaking = ContestTaking;
