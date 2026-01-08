/**
 * Background.js
 * 
 * Менеджер фона игры
 * 
 * Содержит:
 * - Создание фона (createBg)
 * - Обновление фона (updateBg)
 * - Управление прокруткой фона
 * - TilingSprite для бесконечного фона
 */

import * as PIXI from 'pixi.js'
import { BG_SPEED } from '../core/GameConfig.js'

/**
 * Менеджер фона
 */
export class BackgroundManager {
    constructor(world, WORLD_WIDTH, WORLD_HEIGHT, gameHeight, resources) {
        this.world = world
        this.WORLD_WIDTH = WORLD_WIDTH
        this.WORLD_HEIGHT = WORLD_HEIGHT
        this.gameHeight = gameHeight
        this.resources = resources
        
        // Фон
        this.background = null
        
        // Состояние прокрутки
        this.bgPosition = 0
        this.bgSpeed = BG_SPEED
        
        // Callbacks
        this.gameStart = false
        this.playerSpeed = null
        this.gameSpeed = null
        this.zeroLeft = null
    }
    
    /**
     * Устанавливает текстуру фона
     */
    setTexture(resources) {
        this.resources = resources
    }
    
    /**
     * Обновляет состояние
     */
    updateState(state) {
        if (state.gameStart !== undefined) this.gameStart = state.gameStart
        if (state.playerSpeed !== undefined) this.playerSpeed = state.playerSpeed
        if (state.gameSpeed !== undefined) this.gameSpeed = state.gameSpeed
        if (state.zeroLeft !== undefined) this.zeroLeft = state.zeroLeft
    }
    
    /**
     * Создает фон
     * @returns {PIXI.TilingSprite} созданный фон
     */
    createBg() {
        const tiling = new PIXI.TilingSprite(this.resources.bg, this.WORLD_WIDTH + 100, this.gameHeight + 100)
        tiling.anchor.set(0.5, 1)
        tiling.zIndex = -10
        tiling.tilePosition.y = this.gameHeight
        tiling.position.set(this.WORLD_WIDTH / 2, this.WORLD_HEIGHT)
        
        if (this.world) {
            this.world.addChild(tiling)
        }
        
        this.background = tiling
        return tiling
    }
    
    /**
     * Обновляет фон
     */
    updateBg() {
        if (!this.background) return
        
        if (this.gameStart) {
            // Прокрутка фона
            let speed = 1
            if (this.playerSpeed !== null && this.playerSpeed !== undefined) {
                if (typeof this.playerSpeed === 'object' && this.playerSpeed.value !== undefined) {
                    speed = this.playerSpeed.value
                } else if (typeof this.playerSpeed === 'number') {
                    speed = this.playerSpeed
                }
            }
            const gameSpeed = this.gameSpeed !== null && this.gameSpeed !== undefined ? 
                this.gameSpeed.value || this.gameSpeed : 1
            
            this.bgPosition -= (this.bgSpeed * speed) * gameSpeed
            
            // Обновление позиции фона
            if (this.zeroLeft !== null && this.zeroLeft !== undefined) {
                this.background.x = this.zeroLeft + this.WORLD_WIDTH / 2
            }
            this.background.tilePosition.x = this.bgPosition
        }
    }
    
    /**
     * Сбрасывает позицию прокрутки
     */
    reset() {
        this.bgPosition = 0
        if (this.background) {
            this.background.tilePosition.x = 0
        }
    }
    
    /**
     * Очищает фон
     */
    clear() {
        if (this.background && this.world) {
            this.world.removeChild(this.background)
        }
        this.background = null
        this.bgPosition = 0
    }
}
