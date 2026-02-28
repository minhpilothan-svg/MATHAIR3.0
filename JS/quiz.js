// ==================== QUIZ STATE ====================

// Shuffle function - xáo trộn mảng
function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Initialize quiz with shuffled questions and options
function initializeQuiz(questions, chapterId, chapterName, gradeId) {
    // Shuffle questions
    const shuffledQuestions = shuffle(questions);
    
    // For each multiple-choice question, shuffle options and store original index
    const processedQuestions = shuffledQuestions.map(q => {
        if (q.type === "multiple-choice") {
            // Store original correctAnswer index
            const originalCorrectOption = q.options[q.correctAnswer];
            
            // Create new question object with shuffled options
            const shuffledOptions = shuffle(q.options);
            
            // Find new index of correct answer
            const newCorrectAnswerIndex = shuffledOptions.indexOf(originalCorrectOption);
            
            return {
                ...q,
                options: shuffledOptions,
                correctAnswer: newCorrectAnswerIndex,
                _originalCorrectAnswer: q.correctAnswer // Keep original for reference
            };
        }
        return q;
    });
    
    AppState.currentQuiz = {
        chapterId: chapterId,
        chapterName: chapterName,
        gradeId: gradeId,
        questions: processedQuestions,
        currentQuestion: 0,
        answers: {},
        startTime: new Date(),
        completed: false
    };
}

function saveCurrentAnswer() {
    const currentQuestion = AppState.currentQuiz.questions[AppState.currentQuiz.currentQuestion];
    if (!currentQuestion) return;
    
    const questionId = currentQuestion.id;
    let answer;
    
    if (currentQuestion.type === "multiple-choice") {
        const selected = document.querySelector('input[name="answer"]:checked');
        answer = selected ? parseInt(selected.value) : null;
    } else if (currentQuestion.type === "text-input" || currentQuestion.type === "calculation") {
        const input = document.getElementById('text-answer');
        answer = input ? input.value.trim() : null;
    }
    
    if (answer !== null) {
        AppState.currentQuiz.answers[questionId] = answer;
    }
}

function saveAnswer(questionId, answer) {
    AppState.currentQuiz.answers[questionId] = answer;
}

function nextQuestion() {
    const current = AppState.currentQuiz.currentQuestion;
    const total = AppState.currentQuiz.questions.length;
    
    if (current < total - 1) {
        saveCurrentAnswer();
        AppState.currentQuiz.currentQuestion = current + 1;
        renderQuestion();
    }
}

function previousQuestion() {
    const current = AppState.currentQuiz.currentQuestion;
    
    if (current > 0) {
        saveCurrentAnswer();
        AppState.currentQuiz.currentQuestion = current - 1;
        renderQuestion();
    }
}

function submitQuiz() {
    saveCurrentAnswer();
    const results = calculateResults();
    renderResultsPage(results);
}

function calculateResults() {
    const quiz = AppState.currentQuiz;
    let correct = 0;

    quiz.questions.forEach((q) => {
        const userAnswer = quiz.answers[q.id];
        if (q.type === "multiple-choice") {
            if (userAnswer === q.correctAnswer) correct++;
        } else {
            // Cho text-input và calculation
            if (q.acceptedAnswers && q.acceptedAnswers.includes(userAnswer)) correct++;
        }
    });

    return {
        correct,
        total: quiz.questions.length,
        percentage: ((correct / quiz.questions.length) * 100).toFixed(1),
        score: ((correct / quiz.questions.length) * 10).toFixed(1),
    };
}

// ==================== RENDER FUNCTIONS ====================

function renderQuestion() {
    const quiz = AppState.currentQuiz;
    const currentIndex = quiz.currentQuestion;
    const question = quiz.questions[currentIndex];
    
    if (!question) {
        showError('Không tìm thấy câu hỏi!');
        return;
    }
    
    const savedAnswer = quiz.answers[question.id];
    const isLast = currentIndex === quiz.questions.length - 1;
    
    let questionHTML = `
        <div class="question-container">
            <div class="question-header">
                <h2>Câu ${currentIndex + 1}/${quiz.questions.length}</h2>
                <div class="progress-bar">
                    <div class="progress" style="width: ${((currentIndex + 1) / quiz.questions.length) * 100}%"></div>
                </div>
            </div>
            
            <div class="question-content">
                <h3>${question.question}</h3>
    `;
    
    // Render based on question type
    if (question.type === "multiple-choice") {
        questionHTML += `<div class="options">`;
        question.options.forEach((option, index) => {
            const checked = savedAnswer === index ? 'checked' : '';
            questionHTML += `
                <label class="option">
                    <input type="radio" name="answer" value="${index}" ${checked}>
                    <span>${option}</span>
                </label>
            `;
        });
        questionHTML += `</div>`;
    } else if (question.type === "text-input" || question.type === "calculation") {
        questionHTML += `
            <div class="text-input-group">
                <input 
                    type="text" 
                    id="text-answer" 
                    class="text-input" 
                    placeholder="Nhập đáp án của bạn"
                    value="${savedAnswer || ''}"
                >
            </div>
        `;
    }
    
    questionHTML += `
            </div>
            
            <div class="question-actions">
                <button class="btn" onclick="previousQuestion()" ${currentIndex === 0 ? 'disabled' : ''}>
                    ← Câu trước
                </button>
                ${isLast ? 
                    `<button class="btn btn-submit" onclick="submitQuiz()">Nộp bài</button>` :
                    `<button class="btn" onclick="nextQuestion()">Câu tiếp →</button>`
                }
            </div>
        </div>
    `;
    
    const main = document.getElementById('main-content');
    main.innerHTML = questionHTML;
}

function renderResultsPage(results) {
    const main = document.getElementById('main-content');
    const quiz = AppState.currentQuiz;
    
    let resultHTML = `
        <div class="results-container">
            <div class="results-header">
                <h2>Kết quả bài kiểm tra</h2>
                <p>Chương: ${quiz.chapterName}</p>
            </div>
            
            <div class="results-score">
                <div class="score-circle">
                    <div class="score-value">${results.score}</div>
                    <div class="score-label">/10</div>
                </div>
                <div class="score-details">
                    <p><strong>Câu đúng:</strong> ${results.correct}/${results.total}</p>
                    <p><strong>Tỷ lệ:</strong> ${results.percentage}%</p>
                </div>
            </div>
            
            <div class="results-review">
                <h3>Chi tiết câu trả lời</h3>
    `;
    
    quiz.questions.forEach((question, index) => {
        const userAnswer = quiz.answers[question.id];
        let isCorrect = false;
        
        if (question.type === "multiple-choice") {
            isCorrect = userAnswer === question.correctAnswer;
        } else {
            isCorrect = question.acceptedAnswers && question.acceptedAnswers.includes(userAnswer);
        }
        
        const statusClass = isCorrect ? 'correct' : 'incorrect';
        const statusText = isCorrect ? '✓ Đúng' : '✗ Sai';
        
        resultHTML += `
            <div class="review-item ${statusClass}">
                <div class="review-header">
                    <span class="status ${statusClass}">${statusText}</span>
                    <span class="question-num">Câu ${index + 1}</span>
                </div>
                <p class="review-question"><strong>${question.question}</strong></p>
                <p class="review-answer"><strong>Đáp án của bạn:</strong> ${userAnswer || 'Chưa trả lời'}</p>
        `;
        
        if (!isCorrect && question.type === "multiple-choice") {
            resultHTML += `<p class="review-correct"><strong>Đáp án đúng:</strong> ${question.options[question.correctAnswer]}</p>`;
        } else if (!isCorrect && question.type !== "multiple-choice") {
            resultHTML += `<p class="review-correct"><strong>Đáp án đúng:</strong> ${question.correctAnswer}</p>`;
        }
        
        if (question.explanation) {
            resultHTML += `<p class="review-explanation"><strong>Giải thích:</strong> ${question.explanation}</p>`;
        }
        
        resultHTML += `</div>`;
    });
    
    resultHTML += `
            </div>
            
            <div class="results-actions">
                <button class="btn" onclick="navigateTo('home')">Về trang chủ</button>
                <button class="btn" onclick="navigateTo('grade', '${quiz.gradeId}')">Quay lại khối học</button>
            </div>
        </div>
    `;
    
    main.innerHTML = resultHTML;
}