let calculatorMode = 'decimal'; // 'decimal' or 'fraction'

function openCalculator() {
    // Tạo modal calculator
    const modal = document.createElement('div');
    modal.className = 'calculator-modal';
    modal.innerHTML = `
        <div class="calculator-content">
            <button class="close-btn" onclick="closeCalculator()">×</button>
            <h2 class="calculator-title">Máy tính</h2>
            <div class="mode-indicator">
                <span id="mode-text">Chế độ: Thập phân</span>
                <button onclick="toggleCalculatorMode()" style="margin-left: 10px; padding: 5px 10px; background: #2196f3; color: white; border: none; border-radius: 5px; cursor: pointer;">Chuyển chế độ</button>
            </div>
            <input type="text" id="calculator-display" placeholder="Nhập số...">
            <div id="calculator-result">0</div>
            <div class="calculator-buttons">
                <button class="clear" onclick="clearCalculator()">C</button>
                <button class="operator" onclick="appendToCalculator('/')">/</button>
                <button class="operator" onclick="appendToCalculator('*')">×</button>
                <button class="operator" onclick="deleteCalculator()">⌫</button>
                <button class="operator" onclick="appendToCalculator('(')">（</button>
                
                <button onclick="appendToCalculator('7')">7</button>
                <button onclick="appendToCalculator('8')">8</button>
                <button onclick="appendToCalculator('9')">9</button>
                <button class="operator" onclick="appendToCalculator('-')">−</button>
                <button class="operator" onclick="appendToCalculator(')')">）</button>
                
                <button onclick="appendToCalculator('4')">4</button>
                <button onclick="appendToCalculator('5')">5</button>
                <button onclick="appendToCalculator('6')">6</button>
                <button class="operator" onclick="appendToCalculator('+')">+</button>
                <button onclick="toggleNegative()">±</button>
                
                <button onclick="appendToCalculator('1')">1</button>
                <button onclick="appendToCalculator('2')">2</button>
                <button onclick="appendToCalculator('3')">3</button>
                <button class="operator" onclick="appendToCalculator('.')" style="grid-column: span 2;">.</button>
                
                <button onclick="appendToCalculator('0')" style="grid-column: span 2;">0</button>
                <button onclick="calculateResult()" style="grid-column: span 3;" class="equals">=</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeCalculator() {
    const modal = document.querySelector('.calculator-modal');
    if (modal) {
        modal.remove();
    }
}

function appendToCalculator(value) {
    const display = document.getElementById('calculator-display');
    if (display) {
        display.value += value;
    }
}

function clearCalculator() {
    const display = document.getElementById('calculator-display');
    const result = document.getElementById('calculator-result');
    if (display) display.value = '';
    if (result) result.innerText = '0';
}

function deleteCalculator() {
    const display = document.getElementById('calculator-display');
    if (display) {
        display.value = display.value.slice(0, -1);
    }
}

function toggleNegative() {
    const display = document.getElementById('calculator-display');
    if (display && display.value) {
        if (display.value.startsWith('-')) {
            display.value = display.value.slice(1);
        } else {
            display.value = '-' + display.value;
        }
    }
}

function calculateResult() {
    const display = document.getElementById('calculator-display');
    const result = document.getElementById('calculator-result');
    
    if (!display || !result) return;
    
    try {
        let expression = display.value;
        if (!expression) {
            result.innerText = '0';
            return;
        }
        
        const calculatedValue = math.evaluate(expression);
        
        if (calculatorMode === 'fraction') {
            result.innerText = displayAsFraction(calculatedValue);
        } else {
            result.innerText = calculatedValue;
        }
        
        display.value = calculatedValue;
    } catch (error) {
        result.innerText = 'Lỗi';
    }
}

function toggleCalculatorMode() {
    if (calculatorMode === 'decimal') {
        calculatorMode = 'fraction';
        document.getElementById('mode-text').innerText = 'Chế độ: Phân số';
    } else {
        calculatorMode = 'decimal';
        document.getElementById('mode-text').innerText = 'Chế độ: Thập phân';
    }
}

function displayAsFraction(value) {
    // Chuyển đổi số thập phân thành phân số
    const tolerance = 1.0E-6;
    let h1 = 1, h2 = 0;
    let k1 = 0, k2 = 1;
    let b = value;
    
    do {
        const a = Math.floor(b);
        let aux = h1;
        h1 = a * h1 + h2;
        h2 = aux;
        aux = k1;
        k1 = a * k1 + k2;
        k2 = aux;
        b = 1 / (b - a);
    } while (Math.abs(value - h1 / k1) > value * tolerance);
    
    if (k1 === 1) {
        return h1.toString();
    }
    return `${h1}/${k1}`;
}