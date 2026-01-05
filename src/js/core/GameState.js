/**
 * GameState.js
 * 
 * Управление состоянием игры
 * 
 * Содержит:
 * - gameState объект (points, kills, score, multiplier, scoreStreak, collectedMoney)
 * - Флаги состояния (isPause, isMenu, gameStart, gameEnd)
 * - Методы для обновления состояния
 * - Методы для работы с очками и множителем
 * - Методы для работы со streak
 */

/**
 * Класс для управления состоянием игры
 */
export class GameState {
    constructor() {
        // Игровые очки и статистика
        this.points = 0
        this.pointsToAdd = 0
        this.kills = 0
        this.score = 'F'
        this.multiplier = 1
        this.scoreStreak = 0
        this.collectedMoney = 0
        
        // Флаги состояния игры
        this.isPause = false
        this.isMenu = true
        this.gameStart = false
        this.gameEnd = false
    }
    
    /**
     * Сброс состояния игры к начальным значениям
     */
    reset() {
        this.points = 0
        this.pointsToAdd = 0
        this.kills = 0
        this.score = 'F'
        this.multiplier = 1
        this.scoreStreak = 0
        this.collectedMoney = 0
        this.isPause = false
        this.gameStart = false
        this.gameEnd = false
    }
    
    /**
     * Добавляет очки к накопленным для отображения
     * @param {number} points - количество очков
     */
    addPoints(points) {
        this.pointsToAdd += points * this.multiplier
    }
    
    /**
     * Обновляет очки (вызывается в игровом цикле)
     * @returns {number} текущее количество очков
     */
    updatePoints() {
        if (this.pointsToAdd > 0) {
            if (this.pointsToAdd < 0) {
                this.pointsToAdd = 0
            }
            const pointsToAdd = Math.max(1, Math.floor(this.pointsToAdd / 50))
            this.pointsToAdd -= pointsToAdd
            this.points += pointsToAdd
        }
        return this.points
    }
    
    /**
     * Обновляет буквенный рейтинг на основе streak
     * @param {boolean} stimpackActive - активен ли стимулятор
     * @returns {string} текущий рейтинг
     */
    updateScore(stimpackActive = false) {
        let multiplier = 1
        
        if (this.scoreStreak < 10) {
            this.score = 'F'
            multiplier = 1
        } else if (this.scoreStreak < 20) {
            this.score = 'E'
            multiplier = 1.1
        } else if (this.scoreStreak < 30) {
            this.score = 'D'
            multiplier = 1.2
        } else if (this.scoreStreak < 40) {
            this.score = 'C'
            multiplier = 1.3
        } else if (this.scoreStreak < 50) {
            this.score = 'B'
            multiplier = 1.4
        } else if (this.scoreStreak < 60) {
            this.score = 'A'
            multiplier = 1.5
        } else if (this.scoreStreak < 70) {
            this.score = 'A+'
            multiplier = 1.6
        } else if (this.scoreStreak < 80) {
            this.score = 'S'
            multiplier = 1.7
        } else if (this.scoreStreak < 90) {
            this.score = 'S+'
            multiplier = 1.8
        } else {
            this.score = 'S++'
            multiplier = 2
        }
        
        // Удваиваем множитель если активен стимулятор
        if (stimpackActive) {
            multiplier = multiplier * 2
        }
        
        this.multiplier = multiplier
        return this.score
    }
    
    /**
     * Уменьшает streak (вызывается таймером)
     */
    decreaseStreak() {
        if (this.scoreStreak > 0) {
            this.scoreStreak--
        }
    }
    
    /**
     * Увеличивает streak
     * @param {number} amount - количество для добавления
     */
    increaseStreak(amount) {
        this.scoreStreak += amount
    }
    
    /**
     * Уменьшает streak
     * @param {number} amount - количество для вычитания
     */
    decreaseStreakBy(amount) {
        this.scoreStreak -= amount
        if (this.scoreStreak < 0) {
            this.scoreStreak = 0
        }
    }
}
