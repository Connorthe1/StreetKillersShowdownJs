import * as PIXI from 'pixi.js'
import {DEFAULT_GAME_SPEED} from "../core/GameConfig";

/**
 * Менеджер ближнего боя
 */
export class MeleeKillManager {
    constructor(hud, gameState, gameWidth, gameHeight, timer, eventBus) {
        this.hud = hud
        this.gameState = gameState
        this.gameWidth = gameWidth
        this.gameHeight = gameHeight
        this.timer = timer
        this.eventBus = eventBus

        // UI ближнего боя
        this.meleeKill = null
        this.enemy = null
        
        // Состояние селектора
        this.selectorSide = true // true = вправо, false = влево
        this.selectorSpeed = 0.5 // скорость движения селектора (из Player.js)
        this.streak = 0 // стрик ближнего боя

        eventBus.on('melee:isActive', () => {
            return this.hasMeleeKill();
        });

        eventBus.on('melee:activate', enemy => {
            if (this.meleeKill) return
            this.activate(enemy)
        })

        eventBus.on('melee:handleMeleeKill', data => {
            this.result(data.skip, data.noDamage)
        })
    }

    /**
     * Обновляет UI ближнего боя (движение селектора)
     */
    update() {
        if (!this.meleeKill) return

        // Проверка на смерть врага
        if (!this.enemy.isAlive) {
            this.result(true, true)
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
     * Создает UI для ближнего боя
     * @param {PIXI.Sprite} enemy - враг для ближнего боя
     */
    activate(enemy) {
        // Пауза анимации кувырка
        this.eventBus.emit('player:rollPause')
        
        // Замедление игры
        this.eventBus.emit('gameSpeed:slow')
        
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
        this.enemy = enemy
        
        // Добавление элементов в контейнер
        this.meleeKill.addChild(redBar)
        this.meleeKill.addChild(greenBar)
        this.meleeKill.addChild(selector)
        
        // Добавление в HUD
        this.hud.addChild(this.meleeKill)
        
        // Таймер для автоматического завершения
        this.timer.sleep(2500, 'melee:timer').then(() => {
            if (this.meleeKill) this.result(true, false)
        })
        
        return this.meleeKill
    }
    
    /**
     * Обрабатывает результат ближнего боя
     * @param {boolean} skip - пропустить проверку (автоматический провал)
     * @param {boolean} noDamage - не наносить урон игроку
     */
    result(skip = false, noDamage = false) {
        if (!skip) {
            const greenBarPosition = this.meleeKill.getChildAt(1).getBounds()
            const selectorPosition = this.meleeKill.getChildAt(2).getBounds()
            
            // Проверка попадания в зеленую зону
            if (selectorPosition.x + selectorPosition.width / 2 > greenBarPosition.x && 
                selectorPosition.x + selectorPosition.width / 2 < greenBarPosition.x + greenBarPosition.width) {
                
                // Успешный удар
                
                // Очки и стрик
                this.eventBus.emit('game:addPoints', 50 + this.streak * 10)
                this.eventBus.emit('game:addScore', 3 + this.streak)

                this.streak += 1.5

            } else {
                // Провал - урон игроку
                // damagePlayer()
            }
        } else {
            // Автоматический провал
            // if (!noDamage) damagePlayer()
        }
        
        // Восстановление скорости игры
        this.eventBus.emit('gameSpeed:default')

        // Удаление UI
        this.clear()

        // Возобновление анимации кувырка
        if (!skip) this.eventBus.emit('player:rollResume')
        this.eventBus.emit('player:meleeEnd')
        
        // Уменьшение стрика через 10 секунд
        this.timer.sleep(10000, 'melee:streak').then(() => {
            if (this.streak > 0) {
                this.streak -= 1.5
            }
        })
    }

    hasMeleeKill() {
        return this.meleeKill !== null
    }

    clear() {
        if (this.meleeKill) {
            if (this.hud) {
                this.hud.removeChild(this.meleeKill)
            }
            this.meleeKill = null
        }
        this.timer.cancel('melee:timer')
    }
}

