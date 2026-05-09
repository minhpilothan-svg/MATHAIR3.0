// ==================== GROQ AI INTEGRATION ====================

// Groq API Configuration
const GROQ_CONFIG = {
    API_URL: "https://api.groq.com/openai/v1/chat/completions",
    API_KEY: "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", // ⚠️ REPLACE WITH YOUR KEY
    MODEL: "llama-3.3-70b-versatile"
};

// Chat History Storage
const ChatHistory = {
    interactions: [],
    maxMessages: 10
};

/**
 * Gọi Groq AI API để nhận trả lời
 * @param {string} prompt - Câu hỏi từ người dùng
 * @returns {Promise<string>} - Trả lời từ AI
 */
async function callGroq(prompt) {
    try {
        const response = await fetch(GROQ_CONFIG.API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_CONFIG.API_KEY}`
            },
            body: JSON.stringify({
                model: GROQ_CONFIG.MODEL,
                messages: [{ role: "user", content: prompt }]
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("Groq API Error:", error);
        return "Xin lỗi, có lỗi xảy ra khi gọi AI. Vui lòng thử lại.";
    }
}

/**
 * Lưu interaction (câu hỏi + trả lời) vào Firestore
 * @param {string} question - Câu hỏi của người dùng
 * @param {string} answer - Trả lời từ AI
 */
async function saveInteraction(question, answer) {
    try {
        if (!window.db) {
            console.error("Firebase không được khởi tạo");
            return;
        }

        const colRef = window.collection(window.db, "chat_history");
        await window.addDoc(colRef, {
            user_ask: question,
            ai_reply: answer,
            time: window.serverTimestamp()
        });

        console.log("✓ Lưu interaction thành công");
    } catch (error) {
        console.error("Lỗi khi lưu vào Firestore:", error);
    }
}

/**
 * Xử lý sự kiện gửi tin nhắn
 */
async function handleChat() {
    const input = document.getElementById("txtInput");
    
    if (!input || !input.value.trim()) {
        alert("Vui lòng nhập câu hỏi!");
        return;
    }

    const userMessage = input.value.trim();
    
    // Hiển thị UI phản hồi
    const resultBox = document.getElementById("result");
    const btnSend = document.getElementById("btnSend");
    const chatMessages = document.getElementById("chat-messages");
    
    if (!resultBox || !btnSend || !chatMessages) {
        console.error("Chat UI elements not found!");
        return;
    }

    // Hiển thị câu hỏi của người dùng
    const userBubble = document.createElement("div");
    userBubble.className = "chat-bubble user";
    userBubble.innerHTML = `<div class="bubble-content">${escapeHtml(userMessage)}</div>`;
    chatMessages.appendChild(userBubble);
    
    input.value = "";
    btnSend.disabled = true;
    btnSend.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Gọi Groq AI
    const answer = await callGroq(userMessage);
    
    // Hiển thị trả lời từ AI
    const aiBubble = document.createElement("div");
    aiBubble.className = "chat-bubble ai";
    aiBubble.innerHTML = `<div class="bubble-content">${escapeHtml(answer)}</div>`;
    chatMessages.appendChild(aiBubble);
    
    // Lưu vào Firestore
    await saveInteraction(userMessage, answer);

    // Lưu vào chat history
    ChatHistory.interactions.push({
        question: userMessage,
        answer: answer,
        timestamp: new Date().toLocaleTimeString()
    });

    // Hiển thị trạng thái lưu thành công
    const saveStatus = document.getElementById("saveStatus");
    if (saveStatus) {
        saveStatus.style.display = "block";
        setTimeout(() => {
            saveStatus.style.display = "none";
        }, 2000);
    }

    // Đặt lại nút
    btnSend.disabled = false;
    btnSend.innerHTML = '<i class="fas fa-paper-plane"></i> Gửi';
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Xử lý sự kiện khi nhấn Enter
 */
function setupChatKeypress() {
    const input = document.getElementById("txtInput");
    if (input) {
        input.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                handleChat();
            }
        });
    }
}

/**
 * Load lịch sử chat từ Firestore
 */
async function loadChatHistory() {
    try {
        if (!window.db) return;

        const colRef = window.collection(window.db, "chat_history");
        const q = window.query(
            colRef,
            window.orderBy("time", "desc"),
            window.limit(ChatHistory.maxMessages)
        );
        
        const snapshot = await window.getDocs(q);
        const historyList = document.getElementById("chat-history-list");
        
        if (!historyList) return;
        
        historyList.innerHTML = "";
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const historyItem = document.createElement("div");
            historyItem.className = "history-item";
            historyItem.innerHTML = `
                <strong>Q:</strong> ${data.user_ask}<br>
                <strong>A:</strong> ${data.ai_reply}<br>
                <small>${new Date(data.time.toDate()).toLocaleString()}</small>
            `;
            historyList.appendChild(historyItem);
        });
    } catch (error) {
        console.error("Lỗi khi tải lịch sử chat:", error);
    }
}

/**
 * Clear lịch sử chat
 */
async function clearChatHistory() {
    if (confirm("Bạn chắc chắn muốn xóa lịch sử chat?")) {
        ChatHistory.interactions = [];
        const historyList = document.getElementById("chat-history-list");
        if (historyList) {
            historyList.innerHTML = "";
        }
        console.log("Đã xóa lịch sử chat");
    }
}

// Initialize chat when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    setupChatKeypress();
    attachChatModalListeners();
    // Load chat history if chat page is displayed
    const chatContainer = document.getElementById("chat-container");
    if (chatContainer) {
        loadChatHistory();
    }
});

/**
 * Escape HTML để tránh XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Mở Chat Modal
 */
function openChatModal() {
    const chatModal = document.getElementById("chat-modal");
    if (chatModal) {
        chatModal.style.display = "flex";
        document.body.style.overflow = "hidden";
        // Focus vào input
        setTimeout(() => {
            const input = document.getElementById("txtInput");
            if (input) input.focus();
        }, 100);
    }
}

/**
 * Đóng Chat Modal
 */
function closeChatModal() {
    const chatModal = document.getElementById("chat-modal");
    if (chatModal) {
        chatModal.style.display = "none";
        document.body.style.overflow = "auto";
    }
}

/**
 * Chuyển giữa các tab
 */
function switchTab(tabName) {
    const chatMessages = document.getElementById("chat-messages");
    const chatHistoryList = document.getElementById("chat-history-list");
    const tabBtns = document.querySelectorAll(".tab-btn");
    
    if (tabName === "current") {
        chatMessages.style.display = "flex";
        chatHistoryList.style.display = "none";
        tabBtns.forEach(btn => {
            btn.classList.remove("active");
            if (btn.textContent.includes("hiện tại")) {
                btn.classList.add("active");
            }
        });
    } else if (tabName === "history") {
        chatMessages.style.display = "none";
        chatHistoryList.style.display = "block";
        loadChatHistory();
        tabBtns.forEach(btn => {
            btn.classList.remove("active");
            if (btn.textContent.includes("Lịch sử")) {
                btn.classList.add("active");
            }
        });
    }
}

/**
 * Attach event listeners cho chat modal
 */
function attachChatModalListeners() {
    const chatModal = document.getElementById("chat-modal");
    const closeBtn = document.getElementById("chat-modal-close");
    
    if (closeBtn) {
        closeBtn.addEventListener("click", closeChatModal);
    }
    
    // Đóng modal khi click bên ngoài
    if (chatModal) {
        chatModal.addEventListener("click", function(e) {
            if (e.target === chatModal) {
                closeChatModal();
            }
        });
    }
}
