/**
 * MeleeKillUI.js
 * 
 * UI для ближнего боя
 * 
 * Содержит:
 * - Создание UI ближнего боя (createMeleeKillUI)
 * - Управление селектором (setMeleeSelector)
 * - Логика мини-игры ближнего боя
 * - Анимация селектора
 */

import * as PIXI from 'pixi.js'

/**
 * Менеджер UI ближнего боя
 */
export class MeleeKillUIManager {
    constructor(hud, gameWidth, gameHeight, gameState, playerState) {
        this.hud = hud
        this.gameWidth = gameWidth
        this.gameHeight = gameHeight
        this.gameState = gameState
        this.playerState = playerState
        
        // UI ближнего боя
        this.meleeKill = null
        this.meleeKillStreakTimer = null
        
        // Callbacks
        this.setGameSpeedCallback = null
        this.setPlayerRollPauseCallback = null
        this.setPlayerRollResumeCallback = null
        this.damageEnemyCallback = null
        this.soundPlayer = null
        this.sleepCallback = null
        this.meleeKillStreak = null
        this.meleeKillStreakTimerCallback = null
    }
    
    /**
     * Устанавливает колбэки
     */
    setCallbacks(callbacks) {
        if (callbacks.setGameSpeed) this.setGameSpeedCallback = callbacks.setGameSpeed
        if (callbacks.setPlayerRollPause) this.setPlayerRollPauseCallback = callbacks.setPlayerRollPause
        if (callbacks.setPlayerRollResume) this.setPlayerRollResumeCallback = callbacks.setPlayerRollResume
        if (callbacks.damageEnemy) this.damageEnemyCallback = callbacks.damageEnemy
        if (callbacks.soundPlayer) this.soundPlayer = callbacks.soundPlayer
        if (callbacks.sleep) this.sleepCallback = callbacks.sleep
        if (callbacks.meleeKillStreak) this.meleeKillStreak = callbacks.meleeKillStreak
        if (callbacks.meleeKillStreakTimer) this.meleeKillStreakTimerCallback = callbacks.meleeKillStreakTimer
    }
    
    /**
     * Создает UI ближнего боя
     * @param {PIXI.Sprite} enemy - враг для ближнего боя
     */
    createMeleeKillUI(enemy) {
        if (!enemy) {
            console.warn('Enemy not provided for melee kill')
            return null
        }
        
        // Очистка предыдущего UI
        this.clear()
        
        // Пауза ролла игрока
        if (this.setPlayerRollPauseCallback) {
            this.setPlayerRollPauseCallback()
        }
        
        // Замедление игры
        if (this.setGameSpeedCallback) {
            this.setGameSpeedCallback(0.1) // slowGameSpeed
        }
        
        // Создание контейнера
        this.meleeKill = new PIXI.Container()
        
        // Красная полоса (фон)
        const redBar = PIXI.Sprite.from(PIXI.Texture.WHITE)
        redBar.height = 50
        redBar.width = this.gameWidth / 1.5
        redBar.anchor.set(0.5)
        redBar.position.set(this.gameWidth / 2, this.gameHeight / 2)
        redBar.tint = 16731469
        
        // Зеленая полоса (зона успеха)
        const greenBar = PIXI.Sprite.from(PIXI.Texture.WHITE)
        greenBar.height = 50
        greenBar.width = this.gameWidth / 5
        greenBar.anchor.set(0, 0.5)
        const greenBarPosition = Math.floor(
            Math.random() * 
            ((redBar.x + redBar.width / 2 - greenBar.width) - (redBar.x - redBar.width / 2)) + 
            (redBar.x - redBar.width / 2)
        )
        greenBar.position.set(greenBarPosition, this.gameHeight / 2)
        greenBar.tint = 6088284
        
        // Селектор (движущийся индикатор)
        const selector = PIXI.Sprite.from(PIXI.Texture.WHITE)
        selector.height = 90
        selector.width = 10
        selector.anchor.set(0, 0.5)
        const selectorPosition = Math.floor(
            Math.random() * 
            ((redBar.x + redBar.width / 2 - greenBar.width) - (redBar.x - redBar.width / 2)) + 
            (redBar.x - redBar.width / 2)
        )
        selector.position.set(selectorPosition, this.gameHeight / 2)
        
        // Сохранение ссылки на врага
        this.meleeKill.enemy = enemy
        
        // Добавление элементов
        this.meleeKill.addChild(redBar)
        this.meleeKill.addChild(greenBar)
        this.meleeKill.addChild(selector)
        
        if (this.hud) {
            this.hud.addChild(this.meleeKill)
        }
        
        // Таймер для автоматического завершения
        if (this.meleeKillStreakTimerCallback) {
            this.meleeKillStreakTimer = this.meleeKillStreakTimerCallback(() => {
                if (this.meleeKill) {
                    this.setMeleeSelector(true)
                }
            }, 2500)
        }
        
        return this.meleeKill
    }
    
    /**
     * Устанавливает селектор (проверка попадания)
     * @param {boolean} skip - пропустить проверку
     * @param {boolean} noDamage - не наносить урон
     */
    setMeleeSelector(skip = false, noDamage = false) {
        if (!this.meleeKill) return
        
        if (!skip) {
            const greenBar = this.meleeKill.getChildAt(1) // Зеленая полоса
            const selector = this.meleeKill.getChildAt(2) // Селектор
            
            if (greenBar && selector) {
                const greenBarBounds = greenBar.getBounds()
                const selectorBounds = selector.getBounds()
                const selectorCenterX = selectorBounds.x + selectorBounds.width / 2
                
                // Проверка попадания в зеленую зону
                if (selectorCenterX > greenBarBounds.x && 
                    selectorCenterX < greenBarBounds.x + greenBarBounds.width) {
                    // Успешное попадание
                    if (!noDamage && this.damageEnemyCallback && this.meleeKill.enemy) {
                        this.damageEnemyCallback(this.meleeKill.enemy, 100)
                    }
                }
            }
        }
        
        // Очистка UI
        this.clear()
        
        // Возобновление ролла игрока
        if (this.setPlayerRollResumeCallback) {
            this.setPlayerRollResumeCallback(200, 700)
        }
        
        // Уменьшение стрика ближнего боя через 10 секунд
        if (this.meleeKillStreak && this.sleepCallback) {
            this.sleepCallback(10000).then(() => {
                if (this.meleeKillStreak.value > 0) {
                    this.meleeKillStreak.value -= 1.5
                }
            })
        }
    }
    
    /**
     * Обновляет селектор (движение)
     * @param {number} speed - скорость движения селектора
     */
    updateSelector(speed = 5) {
        if (!this.meleeKill || this.meleeKill.children.length < 3) return
        
        const selector = this.meleeKill.getChildAt(2)
        const redBar = this.meleeKill.getChildAt(0)
        
        if (!selector || !redBar) return
        
        // Движение селектора
        selector.x += speed
        
        // Проверка границ
        const redBarBounds = redBar.getBounds()
        const selectorBounds = selector.getBounds()
        const selectorRight = selectorBounds.x + selectorBounds.width
        
        if (selectorRight > redBarBounds.x + redBarBounds.width / 2) {
            // Отскок от правой границы
            selector.x = redBarBounds.x + redBarBounds.width / 2 - selectorBounds.width
            speed = -speed
        } else if (selectorBounds.x < redBarBounds.x - redBarBounds.width / 2) {
            // Отскок от левой границы
            selector.x = redBarBounds.x - redBarBounds.width / 2
            speed = -speed
        }
    }
    
    /**
     * Получает UI ближнего боя
     */
    getMeleeKill() {
        return this.meleeKill
    }
    
    /**
     * Проверяет, активен ли ближний бой
     */
    isActive() {
        return this.meleeKill !== null
    }
    
    /**
     * Очищает UI ближнего боя
     */
    clear() {
        if (this.meleeKill && this.hud) {
            this.hud.removeChild(this.meleeKill)
        }
        
        if (this.meleeKillStreakTimer) {
            if (typeof this.meleeKillStreakTimer === 'function') {
                clearTimeout(this.meleeKillStreakTimer)
            } else if (this.meleeKillStreakTimer.clear) {
                this.meleeKillStreakTimer.clear()
            }
            this.meleeKillStreakTimer = null
        }
        
        this.meleeKill = null
    }
}
