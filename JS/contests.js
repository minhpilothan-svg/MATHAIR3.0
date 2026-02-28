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
    
    createContest(contestData) {
        const { title, description, duration, totalQuestions, questionSource, startTime, endTime } = contestData;
        
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
            createdBy: Auth.getCurrentUser()?.id || 'admin_001',
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            duration: parseInt(duration),
            totalQuestions: parseInt(totalQuestions),
            questions: selectedQuestions.map(q => q.id),
            questionSource: questionSource || 'random',
            maxParticipants: 100,
            participants: [],
            results: [],
            status: 'upcoming',
            createdAt: new Date().toISOString()
        };
        
        this.contests.push(newContest);
        this.saveContests();
        
        console.log('New contest created:', newContest);
        
        return {
            success: true,
            message: 'Cuộc thi đã được tạo thành công!',
            contest: newContest
        };
    },
    
    updateContest(contestId, contestData) {
        const { title, description, duration, totalQuestions, questionSource, startTime, endTime } = contestData;
        
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
        
        contest.title = title;
        contest.description = description;
        contest.startTime = new Date(startTime).toISOString();
        contest.endTime = new Date(endTime).toISOString();
        contest.duration = parseInt(duration);
        contest.totalQuestions = parseInt(totalQuestions);
        contest.questions = selectedQuestions.map(q => q.id);
        contest.questionSource = questionSource || 'random';
        
        this.saveContests();
        
        console.log('Contest updated:', contest);
        
        return {
            success: true,
            message: 'Cuộc thi đã được cập nhật thành công!',
            contest: contest
        };
    },
    
    getContestById(contestId) {
        return this.contests.find(c => c.id === contestId);
    },
    
    deleteContest(contestId) {
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
        
        this.contests = this.contests.filter(c => c.id !== contestId);
        this.saveContests();
        
        console.log('Contest deleted:', contestId);
        
        return {
            success: true,
            message: 'Cuộc thi đã được xóa thành công!'
        };
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
    
    submitContest(contestId, answers) {
        const contest = this.contests.find(c => c.id === contestId);
        if (!contest) {
            return {
                success: false,
                message: 'Cuộc thi không tồn tại!'
            };
        }
        
        const user = Auth.getCurrentUser();
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
        
        answers.forEach(answer => {
            const question = this.questions.find(q => q.id === answer.questionId);
            if (question) {
                if (question.type === 'multiple-choice' || question.type === 'calculation') {
                    if (answer.answer === question.correctAnswer) {
                        correctAnswers++;
                        score += (100 / contest.totalQuestions);
                    }
                }
            }
        });
        
        // Calculate Studying Points (10 points for perfect score)
        let pointsGained = 0;
        if (correctAnswers === contest.totalQuestions) {
            pointsGained = 10;
        } else if (correctAnswers > 0) {
            pointsGained = Math.round((correctAnswers / contest.totalQuestions) * 10);
        }
        
        const oldPoints = user.studyingPoints || 1000;
        const newPoints = oldPoints + pointsGained;
        
        const result = {
            userId: user.id,
            score: Math.round(score),
            correctAnswers: correctAnswers,
            totalQuestions: contest.totalQuestions,
            pointsGained: pointsGained,
            oldPoints: oldPoints,
            finalPoints: newPoints,
            completedAt: new Date().toISOString()
        };
        
        contest.participants.push(user.id);
        contest.results.push(result);
        
        user.studyingPoints = newPoints;
        if (!user.completedContests) {
            user.completedContests = [];
        }
        user.completedContests.push(contestId);
        localStorage.setItem('mathair_user', JSON.stringify(user));
        
        Auth.currentUser = user;
        
        this.saveContests();
        
        return {
            success: true,
            message: 'Nộp bài thành công!',
            result: result
        };
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
        localStorage.setItem('mathair_contests', JSON.stringify(this.contests));
        console.log('Contests saved to localStorage. Total:', this.contests.length);
    },
    
    async loadContests() {
        try {
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
            console.log('Total contests loaded:', this.contests.length);
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

document.addEventListener('DOMContentLoaded', async () => {
    await ContestSystem.init();
});