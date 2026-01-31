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
import {BG_SPEED, DEFAULT_GAME_SPEED} from '../core/GameConfig.js'

/**
 * Менеджер фона
 */
export class BackgroundManager {
    constructor(world, worldCoords, gameHeight, resources, gameState) {
        this.world = world
        this.worldCoords = worldCoords
        this.gameHeight = gameHeight
        this.resources = resources
        this.gameState = gameState
        this.gameSpeed = DEFAULT_GAME_SPEED

        // Фон
        this.background = null
        
        // Состояние прокрутки
        this.bgPosition = 0
        this.bgSpeed = BG_SPEED

        this.createBg()
    }
    
    /**
     * Создает фон
     * @returns {PIXI.TilingSprite} созданный фон
     */
    createBg() {
        const tiling = new PIXI.TilingSprite(this.resources.bg, this.worldCoords.worldWidth + 100, this.gameHeight + 100)
        tiling.anchor.set(0.5, 1)
        tiling.zIndex = -10
        tiling.tilePosition.y = this.gameHeight
        tiling.position.set(this.worldCoords.worldWidth / 2, this.worldCoords.worldHeight)
        
        if (this.world) {
            this.world.addChild(tiling)
        }
        
        this.background = tiling
        return tiling
    }
    
    /**
     * Обновляет фон
     */
    updateBg(zeroLeft, playerSpeed) {
        if (!this.background) return
        
        if (this.gameState.gameStart) {
            // Прокрутка фона
            let speed = 1
            if (playerSpeed !== null && playerSpeed !== undefined) {
                if (typeof playerSpeed === 'object' && playerSpeed.value !== undefined) {
                    speed = playerSpeed.value
                } else if (typeof playerSpeed === 'number') {
                    speed = playerSpeed
                }
            }
            const gameSpeed = this.gameSpeed !== null && this.gameSpeed !== undefined ? 
                this.gameSpeed.value || this.gameSpeed : 1
            
            this.bgPosition -= (this.bgSpeed * speed) * gameSpeed
            
            // Обновление позиции фона
            if (zeroLeft !== null && zeroLeft !== undefined) {
                this.background.x = zeroLeft + this.worldCoords.worldWidth / 2
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
