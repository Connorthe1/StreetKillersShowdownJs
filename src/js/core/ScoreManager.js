/**
 * ScoreManager.js
 * 
 * Управление очками и рейтингом
 * 
 * Содержит:
 * - Класс ScoreManager
 * - Метод addPoints(points) - добавление очков
 * - Метод updateScore() - обновление буквенного рейтинга (F, E, D, C, B, A, S, S+, S++)
 * - Метод scoreTimer() - таймер для уменьшения streak
 * - Логика расчета множителя на основе streak
 * - Обновление HUD с очками
 */

/**
 * Менеджер очков и рейтинга
 */
export class ScoreManager {
    constructor(gameState, hudManager) {
        this.gameState = gameState
        this.hudManager = hudManager
        
        // Таймер для уменьшения streak
        this.scoreTimerInterval = null
        
        // Цвета для рейтингов
        this.scoreColors = {
            'F': ["#ffffff", "#ff0000"],
            'E': ["#ffffff", "#ff5858"],
            'D': ["#ffffff", "#ffa4d5"],
            'C': ["#ffffff", "#83b9ff"],
            'B': ["#ffffff", "#b0ff89"],
            'A': ["#ffffff", "#9eff11"],
            'A+': ["#ffffff", "#ffec6e"],
            'S': ["#ffffff", "#ffcd00"],
            'S+': ["#ffffff", "#ffa33c"],
            'S++': ["#ffffff", "#ff6200"]
        }
        
        // Callback для обновления скорости игрока
        this.updatePlayerSpeedCallback = null
    }
    
    /**
     * Устанавливает колбэк для обновления скорости игрока
     */
    setUpdatePlayerSpeedCallback(callback) {
        this.updatePlayerSpeedCallback = callback
    }
    
    /**
     * Добавляет очки
     * @param {number} points - количество очков
     */
    addPoints(points) {
        this.gameState.addPoints(points)
    }
    
    /**
     * Обновляет рейтинг и отображает его в HUD
     * @param {boolean} stimpackActive - активен ли стимулятор
     */
    updateScore(stimpackActive = false) {
        const score = this.gameState.updateScore(stimpackActive)
        
        if (this.hudManager) {
            this.hudManager.updateScore(stimpackActive)
        }
        
        return score
    }
    
    /**
     * Получает цвет для рейтинга
     * @param {string} score - буквенный рейтинг
     * @returns {Array} массив цветов для градиента
     */
    getScoreColor(score) {
        return this.scoreColors[score] || this.scoreColors['F']
    }
    
    /**
     * Запускает таймер для уменьшения streak
     */
    startScoreTimer() {
        if (this.scoreTimerInterval) {
            this.stopScoreTimer()
        }
        
        this.scoreTimerInterval = setInterval(() => {
            if (this.gameState.isPause) return
            if (this.gameState.gameEnd || this.gameState.isMenu) {
                this.stopScoreTimer()
                return
            }
            
            if (this.gameState.scoreStreak <= 0) return
            
            this.gameState.decreaseStreak()
            
            // Обновление скорости игрока на основе очков
            if (this.updatePlayerSpeedCallback) {
                this.updatePlayerSpeedCallback(this.gameState.points / 10000)
            }
        }, 500)
    }
    
    /**
     * Останавливает таймер для уменьшения streak
     */
    stopScoreTimer() {
        if (this.scoreTimerInterval) {
            clearInterval(this.scoreTimerInterval)
            this.scoreTimerInterval = null
        }
    }
    
    /**
     * Обновляет отображение очков в HUD
     */
    updatePointsDisplay() {
        if (this.hudManager) {
            this.hudManager.updatePoints()
        }
    }
    
    /**
     * Обновляет отображение множителя в HUD
     */
    updateMultiplierDisplay() {
        if (this.hudManager) {
            this.hudManager.updateMultiplier()
        }
    }
    
    /**
     * Полное обновление отображения очков и рейтинга
     * @param {boolean} stimpackActive - активен ли стимулятор
     */
    updateAll(stimpackActive = false) {
        this.updatePointsDisplay()
        this.updateMultiplierDisplay()
        this.updateScore(stimpackActive)
    }
    
    /**
     * Очистка ресурсов
     */
    cleanup() {
        this.stopScoreTimer()
    }
}
