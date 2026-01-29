/* ============================================
   ШАХМАТНЫЙ ХОД - MAIN JAVASCRIPT
   ============================================ */

// Конфигурация
const CONFIG = {
    sections: 6,
    currentSection: 0,
    isAnimating: false,
    moveNotations: [
        'e2-e4',
        'Фd1-h5',
        'Ла1-d1',
        'Сf1-c4',
        'Кg1-f3',
        'a2-a4'
    ],
    pieces: ['♔', '♕', '♖', '♗', '♘', '♙'],
    capturedPieces: ['♚', '♛', '♜', '♝', '♞', '♟'],
    typingTexts: [
        'Стратегия победы',
        'Каждый ход важен',
        'Мат конкурентам',
        'Думай. Планируй. Побеждай.',
        'Шах и мат!'
    ]
};

// DOM элементы
const elements = {
    preloader: document.getElementById('preloader'),
    sectionsContainer: document.getElementById('sectionsContainer'),
    captureAnimation: document.getElementById('captureAnimation'),
    attackingPiece: document.getElementById('attackingPiece'),
    capturedPiece: document.getElementById('capturedPiece'),
    moveNotation: document.getElementById('moveNotation'),
    moveIndicator: document.querySelector('.move-indicator'),
    progressFill: document.getElementById('progressFill'),
    progressMoves: document.getElementById('progressMoves'),
    typingText: document.getElementById('typingText'),
    navPieces: document.querySelectorAll('.nav-piece'),
    sections: document.querySelectorAll('.section')
};

/* ============================================
   ИНИЦИАЛИЗАЦИЯ
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initPreloader();
    initProgressIndicator();
    initNavigation();
    initScrollHandler();
    initTypingEffect();
    initCounterAnimation();
    initFormHandler();
});

/* ============================================
   ПРЕЛОАДЕР
   ============================================ */

function initPreloader() {
    setTimeout(() => {
        elements.preloader.classList.add('hidden');
        // Запуск начальных анимаций после загрузки
        animateSection(0);
    }, 2000);
}

/* ============================================
   ИНДИКАТОР ПРОГРЕССА
   ============================================ */

function initProgressIndicator() {
    // Создаём точки прогресса
    for (let i = 0; i < CONFIG.sections; i++) {
        const dot = document.createElement('div');
        dot.className = 'progress-move' + (i === 0 ? ' active' : '');
        dot.dataset.section = i;
        elements.progressMoves.appendChild(dot);
    }
    updateProgress();
}

function updateProgress() {
    const percentage = ((CONFIG.currentSection + 1) / CONFIG.sections) * 100;
    elements.progressFill.style.width = `${percentage}%`;
    
    // Обновляем точки
    const dots = elements.progressMoves.querySelectorAll('.progress-move');
    dots.forEach((dot, index) => {
        dot.classList.remove('active', 'completed');
        if (index < CONFIG.currentSection) {
            dot.classList.add('completed');
        } else if (index === CONFIG.currentSection) {
            dot.classList.add('active');
        }
    });
    
    // Обновляем индикатор хода
    elements.moveIndicator.querySelector('.move-number').textContent = `Ход ${CONFIG.currentSection + 1}`;
    elements.moveNotation.textContent = CONFIG.moveNotations[CONFIG.currentSection];
}

/* ============================================
   НАВИГАЦИЯ
   ============================================ */

function initNavigation() {
    elements.navPieces.forEach((piece, index) => {
        piece.addEventListener('click', () => {
            if (!CONFIG.isAnimating && index !== CONFIG.currentSection) {
                navigateToSection(index);
            }
        });
    });
    updateNavigation();
}

function updateNavigation() {
    elements.navPieces.forEach((piece, index) => {
        piece.classList.remove('active');
        if (index === CONFIG.currentSection) {
            piece.classList.add('active');
        }
    });
}

/* ============================================
   ОБРАБОТЧИК СКРОЛЛА
   ============================================ */

function initScrollHandler() {
    let lastScrollTime = 0;
    const scrollCooldown = 1500;
    
    // Обработка колёсика мыши
    document.addEventListener('wheel', (e) => {
        const now = Date.now();
        if (now - lastScrollTime < scrollCooldown || CONFIG.isAnimating) return;
        
        if (e.deltaY > 0 && CONFIG.currentSection < CONFIG.sections - 1) {
            // Скролл вниз
            navigateToSection(CONFIG.currentSection + 1);
            lastScrollTime = now;
        } else if (e.deltaY < 0 && CONFIG.currentSection > 0) {
            // Скролл вверх
            navigateToSection(CONFIG.currentSection - 1);
            lastScrollTime = now;
        }
    }, { passive: true });
    
    // Обработка свайпов на мобильных
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        if (CONFIG.isAnimating) return;
        
        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchStartY - touchEndY;
        
        if (Math.abs(diff) > 50) {
            if (diff > 0 && CONFIG.currentSection < CONFIG.sections - 1) {
                navigateToSection(CONFIG.currentSection + 1);
            } else if (diff < 0 && CONFIG.currentSection > 0) {
                navigateToSection(CONFIG.currentSection - 1);
            }
        }
    }, { passive: true });
    
    // Клавиатурная навигация
    document.addEventListener('keydown', (e) => {
        if (CONFIG.isAnimating) return;
        
        if ((e.key === 'ArrowDown' || e.key === 'PageDown') && CONFIG.currentSection < CONFIG.sections - 1) {
            navigateToSection(CONFIG.currentSection + 1);
        } else if ((e.key === 'ArrowUp' || e.key === 'PageUp') && CONFIG.currentSection > 0) {
            navigateToSection(CONFIG.currentSection - 1);
        }
    });
}

/* ============================================
   ПЕРЕХОД МЕЖДУ СЕКЦИЯМИ
   ============================================ */

function navigateToSection(targetIndex) {
    if (CONFIG.isAnimating || targetIndex === CONFIG.currentSection) return;
    if (targetIndex < 0 || targetIndex >= CONFIG.sections) return;
    
    CONFIG.isAnimating = true;
    const isForward = targetIndex > CONFIG.currentSection;
    
    // Показываем анимацию взятия фигуры
    playCaptureAnimation(targetIndex, isForward, () => {
        // Переключаем секции
        const currentSection = elements.sections[CONFIG.currentSection];
        const targetSection = elements.sections[targetIndex];
        
        // Анимация выхода текущей секции
        currentSection.classList.remove('active');
        currentSection.classList.add(isForward ? 'exit-left' : 'exit-right');
        
        // Подготовка входящей секции
        targetSection.classList.remove('exit-left', 'exit-right');
        targetSection.classList.add(isForward ? 'enter-right' : 'enter-left');
        
        // Небольшая задержка для анимации входа
        setTimeout(() => {
            targetSection.classList.remove('enter-left', 'enter-right');
            targetSection.classList.add('active');
            
            // Очистка предыдущей секции
            setTimeout(() => {
                currentSection.classList.remove('exit-left', 'exit-right');
            }, 100);
            
            CONFIG.currentSection = targetIndex;
            updateNavigation();
            updateProgress();
            animateSection(targetIndex);
            
            setTimeout(() => {
                CONFIG.isAnimating = false;
            }, 300);
        }, 50);
    });
}

// Глобальная функция для использования в HTML
window.navigateToSection = navigateToSection;

/* ============================================
   АНИМАЦИЯ ВЗЯТИЯ ФИГУРЫ
   ============================================ */

function playCaptureAnimation(targetIndex, isForward, callback) {
    const attackingPieceSymbol = CONFIG.pieces[targetIndex];
    const capturedPieceSymbol = CONFIG.capturedPieces[CONFIG.currentSection];
    
    elements.attackingPiece.textContent = attackingPieceSymbol;
    elements.capturedPiece.textContent = capturedPieceSymbol;
    
    // Позиционирование
    elements.attackingPiece.style.left = isForward ? '30%' : '70%';
    elements.capturedPiece.style.left = '50%';
    elements.capturedPiece.style.transform = 'translateX(-50%)';
    
    // Запуск анимации
    elements.captureAnimation.classList.add('active');
    
    // Звуковой эффект (опционально)
    playMoveSound();
    
    setTimeout(() => {
        elements.captureAnimation.classList.remove('active');
        callback();
    }, 800);
}

/* ============================================
   ЗВУКОВЫЕ ЭФФЕКТЫ
   ============================================ */

function playMoveSound() {
    // Создаём простой звук с помощью Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 300;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // Игнорируем ошибки со звуком
    }
}

/* ============================================
   АНИМАЦИЯ СЕКЦИЙ
   ============================================ */

function animateSection(index) {
    const section = elements.sections[index];
    
    // Анимация карточек с задержкой
    const cards = section.querySelectorAll('.about-card, .service-cell, .portfolio-item, .team-member, .contact-item');
    cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, i * 100 + 200);
    });
    
    // Анимация счётчиков
    if (index === 1) {
        animateCounters(section);
    }
}

/* ============================================
   ЭФФЕКТ ПЕЧАТАЮЩЕГО ТЕКСТА
   ============================================ */

function initTypingEffect() {
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;
    
    function type() {
        const currentText = CONFIG.typingTexts[textIndex];
        
        if (isDeleting) {
            elements.typingText.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 50;
        } else {
            elements.typingText.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 100;
        }
        
        if (!isDeleting && charIndex === currentText.length) {
            typeSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % CONFIG.typingTexts.length;
            typeSpeed = 500;
        }
        
        setTimeout(type, typeSpeed);
    }
    
    setTimeout(type, 1000);
}

/* ============================================
   АНИМАЦИЯ СЧЁТЧИКОВ
   ============================================ */

function initCounterAnimation() {
    // Будет вызвана при переходе на секцию "О нас"
}

function animateCounters(section) {
    const counters = section.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.dataset.count);
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += step;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };
        
        updateCounter();
    });
}

/* ============================================
   ОБРАБОТКА ФОРМЫ
   ============================================ */

function initFormHandler() {
    const form = document.getElementById('contactForm');
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const button = form.querySelector('.submit-button');
            const originalText = button.querySelector('span').textContent;
            
            // Анимация отправки
            button.querySelector('span').textContent = 'Ход сделан!';
            button.style.background = 'linear-gradient(135deg, #2d6a4f, #40916c)';
            
            // Анимация "превращения пешки"
            const pawnPromote = button.querySelector('.pawn-promote');
            pawnPromote.style.animation = 'none';
            pawnPromote.offsetHeight; // Trigger reflow
            pawnPromote.style.animation = 'pawnTransform 1s ease forwards';
            
            // Сброс формы
            setTimeout(() => {
                form.reset();
                button.querySelector('span').textContent = originalText;
                button.style.background = '';
                
                // Показываем сообщение об успехе
                showSuccessMessage();
            }, 2000);
        });
    }
}

function showSuccessMessage() {
    const message = document.createElement('div');
    message.className = 'success-message';
    message.innerHTML = `
        <span class="success-piece">♕</span>
        <span>Ваш ход принят! Мы свяжемся с вами в ближайшее время.</span>
    `;
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(26, 26, 46, 0.95);
        border: 2px solid var(--accent-gold);
        padding: 40px 60px;
        border-radius: 15px;
        z-index: 10000;
        text-align: center;
        animation: messageAppear 0.5s ease forwards;
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.animation = 'messageDisappear 0.5s ease forwards';
        setTimeout(() => message.remove(), 500);
    }, 3000);
}

// Добавляем стили для сообщения
const messageStyles = document.createElement('style');
messageStyles.textContent = `
    @keyframes messageAppear {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
    @keyframes messageDisappear {
        from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }
    @keyframes pawnTransform {
        0% { transform: scale(1); }
        50% { transform: scale(1.5) rotate(180deg); }
        100% { transform: scale(1) rotate(360deg); }
    }
    .success-message .success-piece {
        display: block;
        font-size: 60px;
        color: #d4af37;
        margin-bottom: 20px;
        text-shadow: 0 0 30px rgba(212, 175, 55, 0.5);
    }
`;
document.head.appendChild(messageStyles);

/* ============================================
   ПАРАЛЛАКС ЭФФЕКТ ДЛЯ ФИГУР
   ============================================ */

document.addEventListener('mousemove', (e) => {
    const floatPieces = document.querySelectorAll('.float-piece');
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;
    
    floatPieces.forEach((piece, index) => {
        const speed = (index + 1) * 0.02;
        const x = (mouseX - 0.5) * speed * 100;
        const y = (mouseY - 0.5) * speed * 100;
        piece.style.transform = `translate(${x}px, ${y}px)`;
    });
});

/* ============================================
   HOVER ЭФФЕКТЫ ДЛЯ СЕРВИСОВ
   ============================================ */

document.querySelectorAll('.service-cell').forEach(cell => {
    cell.addEventListener('mouseenter', () => {
        const piece = cell.querySelector('.service-piece');
        piece.style.transform = 'scale(1.2) rotate(10deg)';
        piece.style.textShadow = '0 0 30px rgba(212, 175, 55, 0.5)';
    });
    
    cell.addEventListener('mouseleave', () => {
        const piece = cell.querySelector('.service-piece');
        piece.style.transform = '';
        piece.style.textShadow = '';
    });
});

/* ============================================
   HOVER ЭФФЕКТЫ ДЛЯ ПОРТФОЛИО
   ============================================ */

document.querySelectorAll('.portfolio-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
        // Добавляем лёгкую вибрацию
        item.style.animation = 'portfolioShake 0.3s ease';
    });
    
    item.addEventListener('mouseleave', () => {
        item.style.animation = '';
    });
});

// Добавляем анимацию вибрации
const shakeStyles = document.createElement('style');
shakeStyles.textContent = `
    @keyframes portfolioShake {
        0%, 100% { transform: scale(1.02) rotate(0deg); }
        25% { transform: scale(1.02) rotate(-1deg); }
        75% { transform: scale(1.02) rotate(1deg); }
    }
`;
document.head.appendChild(shakeStyles);

/* ============================================
   ИНИЦИАЛИЗАЦИЯ ШАХМАТНОЙ ДОСКИ
   ============================================ */

function initChessBoard() {
    const board = document.getElementById('chessBoardBg');
    // Дополнительная анимация фоновой доски при скролле
    document.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        board.style.transform = `translate(${scrollY * 0.1}px, ${scrollY * 0.1}px)`;
    });
}

/* ============================================
   KEYBOARD SHORTCUTS INFO
   ============================================ */

console.log(`
╔══════════════════════════════════════════╗
║         🏰 ШАХМАТНЫЙ ХОД 🏰              ║
╠══════════════════════════════════════════╣
║  Управление:                             ║
║  ↑/↓ или PageUp/PageDown - навигация     ║
║  Колёсико мыши - переход между секциями  ║
║  Клик по фигурам справа - быстрый доступ ║
╚══════════════════════════════════════════╝
`);
