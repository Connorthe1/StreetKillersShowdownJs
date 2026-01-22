/**
 * InputHandler.js
 * 
 * Обработчик ввода (клавиатура и свайпы)
 * 
 * Содержит:
 * - Обработка событий клавиатуры (events)
 * - Обработка свайпов на мобильных устройствах (createSwipes)
 * - Маппинг свайпов на клавиши
 * - Проверка условий для действий
 */

/**
 * Обработчик ввода
 */
export class InputHandler {
    constructor(canvas, gameState, playerState, storage, eventBus) {
        this.canvas = canvas
        this.gameState = gameState
        this.playerState = playerState
        this.storage = storage
        this.eventBus = eventBus
        
        // Для свайпов
        this.touchStart = null
        this.touchPosition = null
        this.sensitivity = 20
        
        // Инициализация свайпов
        this.initSwipes()
    }

    handleEvent(key) {
        this.eventBus.emit('player:event', key)
    }
    
    /**
     * Инициализирует обработку свайпов
     */
    initSwipes() {
        if (!this.canvas) {
            console.warn('Canvas not available for swipe initialization')
            return
        }
        
        // Обработчики событий касания
        this.canvas.addEventListener("touchstart", (e) => this.touchStartHandler(e))
        this.canvas.addEventListener("touchmove", (e) => this.touchMoveHandler(e))
        this.canvas.addEventListener("touchend", (e) => this.touchEndHandler(e))
        this.canvas.addEventListener("touchcancel", (e) => this.touchEndHandler(e))

        document.addEventListener('keyup', (e) => {
            this.handleEvent(e.code)
        })
    }
    
    /**
     * Обработчик начала касания
     */
    touchStartHandler(e) {
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
     * Обработчик движения пальца
     */
    touchMoveHandler(e) {
        this.touchPosition = { 
            x: e.changedTouches[0].clientX, 
            y: e.changedTouches[0].clientY 
        }
    }
    
    /**
     * Обработчик окончания касания
     */
    touchEndHandler(e) {
        this.checkSwipeAction()
        
        // Очистка позиций
        this.touchStart = null
        this.touchPosition = null
    }
    
    /**
     * Проверяет действие свайпа и преобразует его в событие клавиатуры
     */
    checkSwipeAction() {
        if (!this.touchStart || !this.touchPosition) return
        
        // Получаем расстояния от начальной до конечной точек
        const d = {
            x: this.touchStart.x - this.touchPosition.x,
            y: this.touchStart.y - this.touchPosition.y
        }
        
        let msg = ""
        
        // Проверяем, движение по какой оси было длиннее
        if (Math.abs(d.x) > Math.abs(d.y)) {
            // Горизонтальное движение
            if (Math.abs(d.x) > this.sensitivity) {
                if (d.x > 0) {
                    msg = "Swipe Left"
                } else {
                    msg = "Swipe Right"
                }
            }
        } else {
            // Вертикальное движение
            if (Math.abs(d.y) > this.sensitivity) {
                if (d.y > 0) {
                    msg = "Swipe up"
                } else {
                    msg = "Swipe down"
                }
            }
        }

        this.handleEvent(this.mapSwipeToKey(msg))
    }
    
    /**
     * Маппинг свайпа на код клавиши (для совместимости с EventManager)
     */
    mapSwipeToKey(swipeMsg) {
        switch (swipeMsg) {
            case 'Swipe down':
                return 'Space'
            case 'Swipe up':
                return 'KeyR'
            case 'Swipe Right':
                return 'KeyE'
            case 'Swipe Left':
                return 'KeyW'
            default:
                return 'KeyF'
        }
    }
}

