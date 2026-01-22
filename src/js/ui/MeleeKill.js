/**
 * MeleeKill.js
 * 
 * Менеджер ближнего боя
 * 
 * Содержит:
 * - Создание UI для ближнего боя (createMeleeKillUI)
 * - Обновление UI (движение селектора)
 * - Обработка результата ближнего боя (handleMeleeKill)
 * - Управление стриком ближнего боя
 */

import * as PIXI from 'pixi.js'
import {DEFAULT_GAME_SPEED, SLOW_GAME_SPEED} from "../core/GameConfig";

/**
 * Менеджер ближнего боя
 */
export class MeleeKillManager {
    constructor(hud, gameState, gameWidth, gameHeight, eventBus) {
        this.hud = hud
        this.gameState = gameState
        this.gameWidth = gameWidth
        this.gameHeight = gameHeight
        this.eventBus = eventBus

        // UI ближнего боя
        this.meleeKill = null
        
        // Состояние селектора
        this.selectorSide = true // true = вправо, false = влево
        this.selectorSpeed = 0.5 // скорость движения селектора (из Player.js)
        this.streak = 0 // стрик ближнего боя
        this.streakTimer = null

        eventBus.on('melee:isActive', () => {
            return this.hasMeleeKill();
        });

        eventBus.on('melee:handleMeleeKill', data => {
            this.handleMeleeKill(data.skip, data.noDamage)
        })
    }
    
    /**
     * Создает UI для ближнего боя
     * @param {PIXI.Sprite} enemy - враг для ближнего боя
     */
    createMeleeKillUI(enemy) {
        // Пауза анимации кувырка
        if (this.playerState.rollId) {
            this.playerState.rollId.pause()
        }
        
        // Замедление игры
        if (this.updateGameSpeedCallback) {
            this.updateGameSpeedCallback(SLOW_GAME_SPEED)
        }
        
        // Создание контейнера UI
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
        
        // Случайная позиция зеленой полосы
        const greenBarPosition = Math.floor(
            Math.random() * 
            ((redBar.x + redBar.width / 2 - greenBar.width) - (redBar.x - redBar.width / 2)) + 
            (redBar.x - redBar.width / 2)
        )
        greenBar.position.set(greenBarPosition, this.gameHeight / 2)
        greenBar.tint = 6088284
        
        // Селектор (движущаяся линия)
        const selector = PIXI.Sprite.from(PIXI.Texture.WHITE)
        selector.height = 90
        selector.width = 10
        selector.anchor.set(0, 0.5)
        
        // Случайная начальная позиция селектора
        const selectorPosition = Math.floor(
            Math.random() * 
            ((redBar.x + redBar.width / 2 - greenBar.width) - (redBar.x - redBar.width / 2)) + 
            (redBar.x - redBar.width / 2)
        )
        selector.position.set(selectorPosition, this.gameHeight / 2)
        
        // Сохранение ссылки на врага
        this.meleeKill.enemy = enemy
        
        // Добавление элементов в контейнер
        this.meleeKill.addChild(redBar)
        this.meleeKill.addChild(greenBar)
        this.meleeKill.addChild(selector)
        
        // Добавление в HUD
        this.hud.addChild(this.meleeKill)
        
        // Таймер для автоматического завершения
        if (this.sleepCallback) {
            this.streakTimer = setTimeout(() => {
                if (this.meleeKill) {
                    this.handleMeleeKill(true, false)
                }
            }, 2500)
        }
        
        return this.meleeKill
    }
    
    /**
     * Обновляет UI ближнего боя (движение селектора)
     */
    updateMeleeKill() {
        if (!this.meleeKill) return
        
        // Проверка на смерть врага
        if (this.meleeKill.enemy && this.meleeKill.enemy.params && this.meleeKill.enemy.params.dead) {
            this.handleMeleeKill(true, true)
            return
        }
        
        const UiBounds = this.meleeKill.getLocalBounds()
        const selector = this.meleeKill.getChildAt(2)
        
        // Движение селектора
        if (this.selectorSide) {
            selector.x += ((this.selectorSpeed + this.streak) * DEFAULT_GAME_SPEED)
        } else {
            selector.x -= ((this.selectorSpeed + this.streak) * DEFAULT_GAME_SPEED)
        }
        
        // Отскок от краев
        if (selector.x + selector.width >= UiBounds.x + UiBounds.width) {
            this.selectorSide = false
        }
        if (selector.x <= UiBounds.x) {
            this.selectorSide = true
        }
    }
    
    /**
     * Обрабатывает результат ближнего боя
     * @param {boolean} skip - пропустить проверку (автоматический провал)
     * @param {boolean} noDamage - не наносить урон игроку
     */
    handleMeleeKill(skip = false, noDamage = false) {
        if (!this.meleeKill) return
        
        if (!skip) {
            const greenBarPosition = this.meleeKill.getChildAt(1).getBounds()
            const selectorPosition = this.meleeKill.getChildAt(2).getBounds()
            
            // Проверка попадания в зеленую зону
            if (selectorPosition.x + selectorPosition.width / 2 > greenBarPosition.x && 
                selectorPosition.x + selectorPosition.width / 2 < greenBarPosition.x + greenBarPosition.width) {
                
                // Успешный удар
                if (this.damageEnemyCallback && this.meleeKill.enemy) {
                    this.damageEnemyCallback(this.meleeKill.enemy, 100)
                }
                
                // Урон ловушкам под игроком
                if (this.traps && this.player) {
                    this.traps.forEach(trap => {
                        const t = trap.getLocalBounds ? trap.getLocalBounds() : trap
                        if (this.player.x > t.x && this.player.x < t.x + t.width) {
                            trap.dead = true
                        }
                    })
                }
                
                // Очки и стрик
                if (this.addPointsCallback) {
                    this.addPointsCallback(50 + this.streak * 10)
                }
                if (this.gameState) {
                    this.gameState.scoreStreak += 3 + this.streak
                }
                this.streak += 1.5
                
                // Анимация ближнего боя
                if (this.gun && this.gun.melee) {
                    if (this.playAnimCallback) {
                        this.playAnimCallback('melee')
                    }
                    if (this.sleepCallback) {
                        this.sleepCallback(150).then(() => {
                            if (this.playerState.inCover) {
                                if (this.playAnimCallback) {
                                    this.playAnimCallback('idle')
                                }
                                return
                            }
                            this.playerState.state = ''
                            if (this.eventsCallback) {
                                this.eventsCallback({ code: 'Space' })
                            }
                        })
                    }
                }
            } else {
                // Провал - урон игроку
                if (this.damagePlayerCallback) {
                    this.damagePlayerCallback()
                }
            }
        } else {
            // Автоматический провал
            if (!noDamage && this.damagePlayerCallback) {
                this.damagePlayerCallback()
            }
        }
        
        // Восстановление скорости игры
        if (this.updateGameSpeedCallback) {
            this.updateGameSpeedCallback(this.defaultGameSpeed)
        }
        
        // Удаление UI
        if (this.hud && this.meleeKill) {
            this.hud.removeChild(this.meleeKill)
        }
        this.meleeKill = null
        
        // Очистка таймера
        if (this.streakTimer) {
            clearTimeout(this.streakTimer)
            this.streakTimer = null
        }
        
        // Уменьшение стрика через 10 секунд
        if (this.sleepCallback) {
            this.sleepCallback(10000).then(() => {
                if (this.streak > 0) {
                    this.streak -= 1.5
                }
            })
        }
        
        // Возобновление анимации кувырка
        if (!skip && this.playerState.rollId) {
            this.playerState.rollId.resume(200, 700)
        }
    }
    
    /**
     * Получает текущий UI ближнего боя
     */
    getMeleeKill() {
        return this.meleeKill
    }
    
    /**
     * Проверяет, активен ли ближний бой
     */
    hasMeleeKill() {
        return this.meleeKill !== null
    }
    
    /**
     * Очищает ближний бой
     */
    clear() {
        if (this.meleeKill) {
            if (this.hud) {
                this.hud.removeChild(this.meleeKill)
            }
            this.meleeKill = null
        }
        if (this.streakTimer) {
            clearTimeout(this.streakTimer)
            this.streakTimer = null
        }
    }
}

