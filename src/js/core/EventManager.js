/**
 * EventManager.js
 * 
 * Менеджер событий ввода (клавиатура, тач)
 * 
 * Содержит:
 * - Обработка событий клавиатуры (events)
 * - Обработка тач-событий (TouchStart, TouchMove, TouchEnd)
 * - Определение свайпов
 * - Маппинг свайпов на клавиши
 */

/**
 * Менеджер событий
 */
export class EventManager {
    constructor() {
        this.touchStart = null
        this.touchPosition = null
        this.sensitivity = 50 // Минимальное расстояние для определения свайпа
        
        // Колбэки для обработки событий
        this.onKeyPress = null
        this.onSwipe = null
    }
    
    /**
     * Устанавливает колбэк для обработки нажатий клавиш
     */
    setKeyHandler(handler) {
        this.onKeyPress = handler
    }
    
    /**
     * Устанавливает колбэк для обработки свайпов
     */
    setSwipeHandler(handler) {
        this.onSwipe = handler
    }
    
    /**
     * Обработчик событий клавиатуры
     */
    handleKeyEvent(e) {
        if (this.onKeyPress) {
            this.onKeyPress(e)
        }
    }
    
    /**
     * Инициализация обработчиков клавиатуры
     */
    initKeyboardListeners() {
        document.addEventListener('keyup', (e) => {
            this.handleKeyEvent(e)
        })
    }
    
    /**
     * Обработка начала касания
     */
    handleTouchStart(e) {
        this.touchStart = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY
        }
        this.touchPosition = {
            x: this.touchStart.x,
            y: this.touchStart.y
        }
    }
    
    /**
     * Обработка движения пальца
     */
    handleTouchMove(e) {
        this.touchPosition = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY
        }
    }
    
    /**
     * Обработка окончания касания
     */
    handleTouchEnd(e) {
        this.checkAction()
    }
    
    /**
     * Проверка действия (свайп или тап)
     */
    checkAction() {
        if (!this.touchStart || !this.touchPosition) return
        
        const d = {
            x: this.touchPosition.x - this.touchStart.x,
            y: this.touchPosition.y - this.touchStart.y
        }
        
        let msg = null
        
        // Определение направления свайпа
        if (Math.abs(d.x) > Math.abs(d.y)) {
            // Горизонтальный свайп
            if (Math.abs(d.x) > this.sensitivity) {
                if (d.x > 0) {
                    msg = 'Swipe Right'
                } else {
                    msg = 'Swipe Left'
                }
            }
        } else {
            // Вертикальный свайп
            if (Math.abs(d.y) > this.sensitivity) {
                if (d.y > 0) {
                    msg = 'Swipe down'
                } else {
                    msg = 'Swipe up'
                }
            }
        }
        
        // Если свайп не определен, считаем это тапом
        if (!msg) {
            msg = 'Tap'
        }
        
        // Вызов обработчика свайпа
        if (this.onSwipe) {
            this.onSwipe(msg, d)
        }
        
        // Сброс позиций
        this.touchStart = null
        this.touchPosition = null
    }
    
    /**
     * Маппинг свайпов на коды клавиш
     */
    mapSwipeToKey(swipeMsg) {
        const swipeToKeyMap = {
            'Swipe down': 'Space',
            'Swipe up': 'KeyR',
            'Swipe Right': 'KeyE',
            'Swipe Left': 'KeyW',
            'Tap': 'KeyF'
        }
        
        return swipeToKeyMap[swipeMsg] || null
    }
    
    /**
     * Инициализация тач-обработчиков для canvas
     */
    initTouchListeners(canvas) {
        if (!canvas) return
        
        canvas.addEventListener('touchstart', (e) => {
            this.handleTouchStart(e)
        })
        
        canvas.addEventListener('touchmove', (e) => {
            this.handleTouchMove(e)
        })
        
        canvas.addEventListener('touchend', (e) => {
            this.handleTouchEnd(e)
        })
        
        canvas.addEventListener('touchcancel', (e) => {
            this.handleTouchEnd(e)
        })
    }
    
    /**
     * Инициализация всех обработчиков
     */
    init(canvas) {
        this.initKeyboardListeners()
        if (canvas) {
            this.initTouchListeners(canvas)
        }
    }
    
    /**
     * Удаление всех обработчиков
     */
    destroy() {
        // Очистка обработчиков при необходимости
        this.onKeyPress = null
        this.onSwipe = null
    }
}
