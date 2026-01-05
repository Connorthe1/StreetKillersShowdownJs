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
    constructor(canvas, gameState, playerState, storage) {
        this.canvas = canvas
        this.gameState = gameState
        this.playerState = playerState
        this.storage = storage
        
        // Callbacks для действий
        this.onReload = null
        this.onRoll = null
        this.onShot = null
        this.onGrenade = null
        this.onStimpack = null
        this.onToggleSpeed = null
        this.onMeleeKill = null
        
        // Для свайпов
        this.touchStart = null
        this.touchPosition = null
        this.sensitivity = 20
        
        // Инициализация свайпов
        this.initSwipes()
    }
    
    /**
     * Устанавливает колбэки для действий
     */
    setCallbacks(callbacks) {
        if (callbacks.onReload) this.onReload = callbacks.onReload
        if (callbacks.onRoll) this.onRoll = callbacks.onRoll
        if (callbacks.onShot) this.onShot = callbacks.onShot
        if (callbacks.onGrenade) this.onGrenade = callbacks.onGrenade
        if (callbacks.onStimpack) this.onStimpack = callbacks.onStimpack
        if (callbacks.onToggleSpeed) this.onToggleSpeed = callbacks.onToggleSpeed
        if (callbacks.onMeleeKill) this.onMeleeKill = callbacks.onMeleeKill
    }
    
    /**
     * Обновляет состояние
     */
    updateState(state) {
        if (state.gameState !== undefined) this.gameState = state.gameState
        if (state.playerState !== undefined) this.playerState = state.playerState
        if (state.storage !== undefined) this.storage = state.storage
    }
    
    /**
     * Обрабатывает событие клавиатуры
     * @param {KeyboardEvent} e - событие клавиатуры
     */
    handleEvent(e) {
        // Проверка условий для обработки событий
        if (this.playerState.health === 0 || 
            this.gameState.gameEnd || 
            this.gameState.isPause || 
            this.gameState.isMenu || 
            !this.gameState.gameStart) {
            return
        }
        
        if (this.playerState.inZipLine) return
        
        // Обработка различных клавиш
        switch (e.code) {
            case 'KeyR':
                if (this.onReload) {
                    this.onReload()
                }
                break
                
            case 'Space':
                if (this.onRoll) {
                    this.onRoll()
                }
                break
                
            case 'KeyF':
                if (this.onShot) {
                    this.onShot()
                }
                break
                
            case 'KeyE':
                if (this.onGrenade) {
                    this.onGrenade()
                }
                break
                
            case 'KeyW':
                if (this.onStimpack) {
                    this.onStimpack()
                }
                break
                
            case 'KeyQ':
                if (this.onToggleSpeed) {
                    this.onToggleSpeed()
                }
                break
        }
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
        
        // Преобразуем свайп в событие клавиатуры
        let keyCode = null
        switch (msg) {
            case 'Swipe down':
                keyCode = 'Space'
                break
            case 'Swipe up':
                keyCode = 'KeyR'
                break
            case 'Swipe Right':
                keyCode = 'KeyE'
                break
            case 'Swipe Left':
                keyCode = 'KeyW'
                break
            default:
                keyCode = 'KeyF'
                break
        }
        
        // Вызываем обработчик события
        if (keyCode) {
            this.handleEvent({ code: keyCode })
        }
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

