// MathAir Contests & SP System - WITH COUNTDOWN TIMER

const ContestSystem = {
    contests: [],
    questions: [],
    questionsLoaded: false,
    countdownIntervals: {},
    
    async init() {
        await this.loadContests();
        
        if (!this.questionsLoaded) {
            await this.loadQuestions();
            this.questionsLoaded = true;
        }
        
        console.log('ContestSystem initialized. Contests:', this.contests.length, 'Questions:', this.questions.length);
    },
    
    async loadQuestions() {
        try {
            const response = await fetch('DATA/questions.json');
            if (!response.ok) throw new Error('Failed to load questions');
            const data = await response.json();
            this.questions = data.questions || [];
        } catch (error) {
            console.error('Error loading questions:', error);
            this.questions = [];
        }
    },
    
    async createContest(contestData) {
        const { title, description, duration, totalQuestions, questionSource, startTime, endTime, reward70, reward80, reward90 } = contestData;
        
        if (!title || !description || !duration || !totalQuestions || !startTime || !endTime) {
            return {
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin cuộc thi!'
            };
        }
        
        const start = new Date(startTime);
        const end = new Date(endTime);
        
        if (end <= start) {
            return {
                success: false,
                message: 'Ngày kết thúc phải sau ngày bắt đầu!'
            };
        }
        
        if (totalQuestions > this.questions.length) {
            return {
                success: false,
                message: `Chỉ có ${this.questions.length} câu hỏi có sẵn!`
            };
        }
        
        const selectedQuestions = this.getRandomQuestions(totalQuestions, questionSource);
        
        const newContest = {
            id: `contest_${Date.now()}`,
            title,
            description,
            createdBy: window.Auth?.getCurrentUser()?.id || 'admin_001',
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            duration: parseInt(duration),
            totalQuestions: parseInt(totalQuestions),
            questions: selectedQuestions.map(q => q.id),
            questionSource: questionSource || 'random',
            reward70: reward70 || 5,
            reward80: reward80 || 7,
            reward90: reward90 || 10,
            maxParticipants: 100,
            participants: [],
            results: [],
            status: 'upcoming',
            createdAt: new Date().toISOString()
        };
        
        try {
            // Add to Firestore
            if (window.firebaseDb) {
                await window.firebaseDb.collection('contests').doc(newContest.id).set(newContest);
                console.log('Contest saved to Firestore:', newContest);
            }
            
            this.contests.push(newContest);
            // Sync to localStorage
            this.saveContests();
            console.log('New contest created:', newContest);
            
            return {
                success: true,
                message: 'Cuộc thi đã được tạo thành công!',
                contest: newContest
            };
        } catch (error) {
            console.error('Error creating contest in Firestore:', error);
            return {
                success: false,
                message: 'Lỗi khi tạo cuộc thi: ' + error.message
            };
        }
    },
    
    async updateContest(contestId, contestData) {
        const { title, description, duration, totalQuestions, questionSource, startTime, endTime, reward70, reward80, reward90 } = contestData;
        
        const contest = this.contests.find(c => c.id === contestId);
        if (!contest) {
            return {
                success: false,
                message: 'Cuộc thi không tồn tại!'
            };
        }
        
        if (contest.participants && contest.participants.length > 0) {
            return {
                success: false,
                message: 'Không thể chỉnh sửa cuộc thi đã có người tham gia!'
            };
        }
        
        if (!title || !description || !duration || !totalQuestions || !startTime || !endTime) {
            return {
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin cuộc thi!'
            };
        }
        
        const now = new Date();
        const start = new Date(startTime);
        const end = new Date(endTime);
        
        if (start < now) {
            return {
                success: false,
                message: 'Ngày bắt đầu không được phép ở trong quá khứ!'
            };
        }
        
        if (end <= start) {
            return {
                success: false,
                message: 'Ngày kết thúc phải sau ngày bắt đầu!'
            };
        }
        
        if (totalQuestions > this.questions.length) {
            return {
                success: false,
                message: `Chỉ có ${this.questions.length} câu hỏi có sẵn!`
            };
        }
        
        const selectedQuestions = this.getRandomQuestions(totalQuestions, questionSource);
        
        try {
            contest.title = title;
            contest.description = description;
            contest.startTime = new Date(startTime).toISOString();
            contest.endTime = new Date(endTime).toISOString();
            contest.duration = parseInt(duration);
            contest.totalQuestions = parseInt(totalQuestions);
            contest.questions = selectedQuestions.map(q => q.id);
            contest.questionSource = questionSource || 'random';
            contest.reward70 = reward70 || 5;
            contest.reward80 = reward80 || 7;
            contest.reward90 = reward90 || 10;
            contest.updatedAt = new Date().toISOString();
            
            // Update in Firestore
            if (window.firebaseDb) {
                await window.firebaseDb.collection('contests').doc(contestId).update(contest);
                console.log('Contest updated in Firestore:', contest);
            }
            
            // Sync to localStorage
            this.saveContests();
            console.log('Contest updated:', contest);
            
            return {
                success: true,
                message: 'Cuộc thi đã được cập nhật thành công!',
                contest: contest
            };
        } catch (error) {
            console.error('Error updating contest in Firestore:', error);
            return {
                success: false,
                message: 'Lỗi khi cập nhật cuộc thi: ' + error.message
            };
        }
    },
    
    getContestById(contestId) {
        return this.contests.find(c => c.id === contestId);
    },
    
    async deleteContest(contestId) {
        const contest = this.contests.find(c => c.id === contestId);
        if (!contest) {
            return {
                success: false,
                message: 'Cuộc thi không tồn tại!'
            };
        }
        
        if (contest.participants && contest.participants.length > 0) {
            return {
                success: false,
                message: 'Không thể xóa cuộc thi đã có người tham gia!'
            };
        }
        
        try {
            // Delete from Firestore
            if (window.firebaseDb) {
                await window.firebaseDb.collection('contests').doc(contestId).delete();
                console.log('Contest deleted from Firestore:', contestId);
            }
            
            this.contests = this.contests.filter(c => c.id !== contestId);
            
            // Sync to localStorage
            this.saveContests();
            
            console.log('Contest deleted:', contestId);
            
            return {
                success: true,
                message: 'Cuộc thi đã được xóa thành công!'
            };
        } catch (error) {
            console.error('Error deleting contest from Firestore:', error);
            return {
                success: false,
                message: 'Lỗi khi xóa cuộc thi: ' + error.message
            };
        }
    },
    
    getRandomQuestions(count, source) {
        let filtered = this.questions;
        
        if (source && source !== 'random') {
            filtered = this.questions.filter(q => q.chapterId === source);
        }
        
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    },
    
    getContestDetails(contestId) {
        const contest = this.contests.find(c => c.id === contestId);
        if (!contest) return null;
        
        const questionObjects = contest.questions.map(qId => 
            this.questions.find(q => q.id === qId)
        ).filter(q => q);
        
        return {
            ...contest,
            questionObjects: questionObjects
        };
    },
    
    async submitContest(contestId, answers, timeTaken = 0) {
        const contest = this.contests.find(c => c.id === contestId);
        if (!contest) {
            return {
                success: false,
                message: 'Cuộc thi không tồn tại!'
            };
        }
        
        const user = window.Auth?.getCurrentUser();
        if (!user) {
            return {
                success: false,
                message: 'Vui lòng đăng nhập để tham gia thi!'
            };
        }
        
        if (contest.participants.includes(user.id)) {
            return {
                success: false,
                message: 'Bạn đã tham gia cuộc thi này rồi!'
            };
        }
        
        let correctAnswers = 0;
        let score = 0;
        let gradedQuestions = 0;
        let essayCount = 0;
        
        // Count questions by type and calculate score
        contest.questions.forEach(question => {
            if (question.type === 'essay') {
                essayCount++;
                return; // Skip essay questions from grading
            }
            
            gradedQuestions++;
            
            const answer = answers.find(a => a.questionId === question.id);
            if (answer) {
                if (question.type === 'multiple-choice' || question.type === 'calculation') {
                    if (answer.answer === question.correctAnswer) {
                        correctAnswers++;
                    }
                } else if (question.type === 'text-input') {
                    // For text-input, check against acceptedAnswers
                    if (question.acceptedAnswers && question.acceptedAnswers.includes(answer.answer)) {
                        correctAnswers++;
                    }
                }
            }
        });
        
        // Calculate percentage based on graded questions only
        const total = gradedQuestions || 1; // Avoid division by zero
        score = gradedQuestions > 0 ? Math.round((correctAnswers / total) * 100) : 0;
        
        // Calculate Studying Points based on score tiers
        let pointsGained = 0;
        if (score >= 90) {
            pointsGained = contest.reward90 || 10;
        } else if (score >= 80) {
            pointsGained = contest.reward80 || 7;
        } else if (score >= 70) {
            pointsGained = contest.reward70 || 5;
        }
        
        const oldPoints = user.studyingPoints || 1000;
        const newPoints = oldPoints + pointsGained;
        
        const result = {
            userId: user.id,
            score: score,
            correctAnswers: correctAnswers,
            totalQuestions: gradedQuestions,
            essayCount: essayCount,
            pointsGained: pointsGained,
            oldPoints: oldPoints,
            finalPoints: newPoints,
            timeTaken: timeTaken,
            completedAt: new Date().toISOString()
        };
        
        try {
            contest.participants.push(user.id);
            contest.results.push(result);
            
            // Update contest in Firestore with new participant and result
            if (window.firebaseDb) {
                await window.firebaseDb.collection('contests').doc(contestId).update({
                    participants: contest.participants,
                    results: contest.results
                });
                console.log('Contest submission saved to Firestore');
            }
            
            // Sync to localStorage
            this.saveContests();
            
            user.studyingPoints = newPoints;
            if (!user.completedContests) {
                user.completedContests = [];
            }
            user.completedContests.push(contestId);
            localStorage.setItem('mathair_user', JSON.stringify(user));
            
            if (window.Auth) {
                window.Auth.currentUser = user;
            }
            
            return {
                success: true,
                message: 'Nộp bài thành công!',
                result: result
            };
        } catch (error) {
            console.error('Error submitting contest:', error);
            return {
                success: false,
                message: 'Lỗi khi nộp bài: ' + error.message
            };
        }
    },
    
    // COUNTDOWN TIMER FUNCTIONS
    startCountdownTimers() {
        // Clear existing intervals
        Object.values(this.countdownIntervals).forEach(interval => clearInterval(interval));
        this.countdownIntervals = {};
        
        // Start countdown for each contest
        this.contests.forEach(contest => {
            const timerId = `timer-${contest.id}`;
            const timerElement = document.getElementById(timerId);
            
            if (!timerElement) return;
            
            const interval = setInterval(() => {
                this.updateCountdownTimer(contest.id);
            }, 1000);
            
            this.countdownIntervals[contest.id] = interval;
            this.updateCountdownTimer(contest.id);
        });
    },
    
    updateCountdownTimer(contestId) {
        const contest = this.contests.find(c => c.id === contestId);
        if (!contest) return;
        
        const timerElement = document.getElementById(`timer-${contestId}`);
        if (!timerElement) return;
        
        const now = new Date();
        const startTime = new Date(contest.startTime);
        const endTime = new Date(contest.endTime);
        
        let timeText = '';
        let statusClass = '';
        
        if (now < startTime) {
            // Upcoming
            const diff = startTime - now;
            timeText = this.formatTimeDifference(diff, 'Bắt đầu trong');
            statusClass = 'upcoming';
        } else if (now >= startTime && now <= endTime) {
            // Active
            const diff = endTime - now;
            timeText = this.formatTimeDifference(diff, 'Còn lại');
            statusClass = 'active';
        } else {
            // Ended
            timeText = 'Đã kết thúc';
            statusClass = 'ended';
            clearInterval(this.countdownIntervals[contestId]);
        }
        
        timerElement.textContent = timeText;
        timerElement.className = `contest-timer ${statusClass}`;
    },
    
    formatTimeDifference(milliseconds, prefix = '') {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            const remainingHours = hours % 24;
            return `${prefix} ${days} ngày ${remainingHours} giờ`;
        } else if (hours > 0) {
            const remainingMinutes = minutes % 60;
            return `${prefix} ${hours} giờ ${remainingMinutes} phút`;
        } else if (minutes > 0) {
            const remainingSeconds = seconds % 60;
            return `${prefix} ${minutes} phút ${remainingSeconds} giây`;
        } else {
            return `${prefix} ${seconds} giây`;
        }
    },
    
    stopCountdownTimers() {
        Object.values(this.countdownIntervals).forEach(interval => clearInterval(interval));
        this.countdownIntervals = {};
    },
    
    getActiveContests() {
        const now = new Date();
        return this.contests.filter(c => {
            const start = new Date(c.startTime);
            const end = new Date(c.endTime);
            return start <= now && now <= end;
        });
    },
    
    getUpcomingContests() {
        const now = new Date();
        return this.contests.filter(c => {
            const start = new Date(c.startTime);
            return start > now;
        });
    },
    
    hasUserCompletedContest(userId, contestId) {
        const contest = this.contests.find(c => c.id === contestId);
        if (!contest) return false;
        return contest.participants.includes(userId);
    },
    
    saveContests() {
        // Data is now saved to Firestore directly in create/update/delete methods
        // Keep this for backward compatibility
        localStorage.setItem('mathair_contests', JSON.stringify(this.contests));
        console.log('Contests synchronized to localStorage. Total:', this.contests.length);
    },
    
    async loadContests() {
        try {
            // Firestore is the source of truth
            if (window.firebaseDb) {
                try {
                    const contestsSnap = await window.firebaseDb.collection('contests').get();
                    const firestoreContests = [];
                    
                    contestsSnap.forEach(doc => {
                        firestoreContests.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    
                    this.contests = firestoreContests;
                    console.log('Loaded from Firestore:', firestoreContests.length, 'contests');
                    return;
                } catch (firestoreError) {
                    console.warn('Firestore load failed, falling back to JSON+localStorage:', firestoreError);
                    // Fall through to JSON/localStorage fallback
                }
            }
            
            // Fallback: Load from JSON + localStorage
            const response = await fetch('DATA/contests.json');
            if (!response.ok) throw new Error('Failed to load contests from JSON');
            const jsonData = await response.json();
            let contests = jsonData.contests || [];
            
            const localStorageData = localStorage.getItem('mathair_contests');
            if (localStorageData) {
                try {
                    const localContests = JSON.parse(localStorageData);
                    const jsonIds = contests.map(c => c.id);
                    const newContests = localContests.filter(c => !jsonIds.includes(c.id));
                    contests = [...contests, ...newContests];
                    console.log('Loaded from JSON:', jsonData.contests.length, 'New from localStorage:', newContests.length);
                } catch (e) {
                    console.warn('Error parsing localStorage contests:', e);
                }
            }
            
            this.contests = contests;
            console.log('Total contests loaded (fallback):', this.contests.length);
        } catch (error) {
            console.error('Error loading contests:', error);
            const localStorageData = localStorage.getItem('mathair_contests');
            if (localStorageData) {
                try {
                    this.contests = JSON.parse(localStorageData);
                    console.log('Loaded contests from localStorage (fallback):', this.contests.length);
                } catch (e) {
                    console.warn('Error parsing localStorage:', e);
                    this.contests = [];
                }
            } else {
                this.contests = [];
            }
        }
    },
};
// Expose ContestSystem globally
window.ContestSystem = ContestSystem;
document.addEventListener('DOMContentLoaded', async () => {
    await ContestSystem.init();
});