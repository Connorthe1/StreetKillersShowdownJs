/**
 * Wall.js
 * 
 * Менеджер стен и укрытий
 * 
 * Содержит:
 * - Создание уличных стен (createWall)
 * - Создание укрытий в зданиях (createCoverInBuild, createCoverInClub)
 * - Обновление стен (updateWall)
 * - Обнаружение стены для укрытия (detectWall)
 * - Управление массивами стен
 */

import * as PIXI from 'pixi.js'
import { random } from '../utils/GameUtils.js'

/**
 * Менеджер стен
 */
export class WallManager {
    constructor(world, player, ground, zeroLeft, zeroRight, afterBuilding, textures, inBuildTexture, inFloorTexture, inClubTexture) {
        this.world = world
        this.player = player
        this.ground = ground
        this.zeroLeft = zeroLeft
        this.zeroRight = zeroRight
        this.afterBuilding = afterBuilding
        this.textures = textures
        this.inBuildTexture = inBuildTexture
        this.inFloorTexture = inFloorTexture
        this.inClubTexture = inClubTexture
        
        // Массив стен
        this.walls = []
        
        // Callbacks
        this.createEnemyCallback = null
        this.createGarbageCallback = null
    }
    
    /**
     * Устанавливает колбэки
     */
    setCallbacks(callbacks) {
        if (callbacks.createEnemy) this.createEnemyCallback = callbacks.createEnemy
        if (callbacks.createGarbage) this.createGarbageCallback = callbacks.createGarbage
    }
    
    /**
     * Обновляет состояние
     */
    updateState(state) {
        if (state.player !== undefined) this.player = state.player
        if (state.zeroLeft !== undefined) this.zeroLeft = state.zeroLeft
        if (state.zeroRight !== undefined) this.zeroRight = state.zeroRight
        if (state.afterBuilding !== undefined) this.afterBuilding = state.afterBuilding
    }
    
    /**
     * Создает уличную стену
     * @param {number} pos - позиция X (опционально)
     * @param {boolean} forBoss - для босса
     */
    createWall(pos = null, forBoss = false) {
        if (!this.textures) {
            console.warn('Wall textures not available')
            return null
        }
        
        const randomPos = pos || this.zeroRight + random(100, 250)
        
        // Спавн врага рядом со стеной (если не для босса)
        if (!pos && !forBoss && this.createEnemyCallback) {
            const rand = random(1, 10)
            if (rand > 5) {
                this.createEnemyCallback(randomPos + 60, true)
            }
        }
        
        // Проверка на здания
        if (this.afterBuilding > randomPos - 100) {
            return null
        }
        
        // Проверка на другие стены
        if (this.walls.length > 0) {
            const lastWall = this.walls[this.walls.length - 1]
            const wallSize = lastWall.getLocalBounds ? lastWall.getLocalBounds() : lastWall
            if (randomPos > wallSize.x - 100 && randomPos < wallSize.x + wallSize.width + 100) {
                return null
            }
        }
        
        // Создание стены
        let wall
        const randomWall = random(1, 10)
        const groundY = this.ground.getLocalBounds ? this.ground.getLocalBounds().y : 0
        
        if (randomWall < 4) {
            // Стена из мусора
            wall = new PIXI.Sprite(this.textures.textures.coverTrash)
            wall.position.set(randomPos, groundY + 36)
            wall.bound = -20
            wall.coverX = randomPos - 28
        } else {
            // Обычная стена
            wall = new PIXI.Sprite(this.textures.textures.wall)
            wall.position.set(randomPos, groundY + 36)
            wall.bound = 0
            wall.coverX = randomPos - 20
        }
        
        if (forBoss) {
            wall.forBoss = true
        }
        
        wall.anchor.set(0.5)
        
        if (this.world) {
            this.world.addChild(wall)
        }
        
        // Создание мусора рядом со стеной из мусора
        if (Math.random() < 0.5 && randomWall < 4 && this.createGarbageCallback) {
            const pos = random(10, wall.width / 2)
            this.createGarbageCallback(wall.x - wall.width / 2 + pos, wall.y, 4)
        }
        
        this.walls.push(wall)
        return wall
    }
    
    /**
     * Создает укрытие в здании
     * @param {number} pos - позиция X
     * @param {boolean} isSecondFloor - на втором этаже
     * @param {boolean} isRoof - на крыше
     */
    createCoverInBuild(pos, isSecondFloor, isRoof) {
        if (!this.inBuildTexture || !this.inFloorTexture) {
            console.warn('Cover textures not available')
            return null
        }
        
        let wall
        const groundY = this.ground.getLocalBounds ? this.ground.getLocalBounds().y : 0
        
        if (isRoof) {
            const randomWall = Math.floor(Math.random() * (1 + 1))
            wall = new PIXI.Sprite(this.inFloorTexture.textures[`Floor-${randomWall}`])
            wall.coverX = pos - 34
        } else {
            const randomWall = Math.floor(Math.random() * (2 + 1))
            wall = new PIXI.Sprite(this.inBuildTexture.textures[`inhouse-${randomWall}`])
            wall.coverX = pos - 20
        }
        
        wall.bound = 0
        wall.anchor.set(0.5, 1)
        wall.position.set(
            pos,
            isSecondFloor ? (isRoof ? groundY - 115 : groundY - 110) : groundY + 78
        )
        wall.height = wall.height * 2
        wall.width = wall.width * 2
        wall.zIndex = 1
        
        if (this.world) {
            this.world.addChild(wall)
        }
        
        this.walls.push(wall)
        return wall
    }
    
    /**
     * Создает укрытие в клубе
     * @param {number} pos - позиция X
     * @param {number} type - тип укрытия (0, 1, 2)
     * @param {boolean} forBoss - для босса
     */
    createCoverInClub(pos, type, forBoss) {
        if (!this.inClubTexture) {
            console.warn('Club cover textures not available')
            return null
        }
        
        const wall = new PIXI.Sprite(this.inClubTexture.textures[`inClub-${type}`])
        const groundY = this.ground.getLocalBounds ? this.ground.getLocalBounds().y : 0
        
        switch (type) {
            case 0:
                wall.bound = 50
                wall.coverX = pos - 42
                wall.position.set(pos, groundY + 31)
                break
            case 1:
                wall.bound = 80
                wall.coverX = pos - 26
                wall.position.set(pos, groundY + 25)
                break
            case 2:
                wall.bound = 80
                wall.coverX = pos - 30
                wall.position.set(pos, groundY + 33)
                break
        }
        
        if (forBoss) {
            wall.forBoss = true
        }
        
        wall.anchor.set(0.5)
        wall.height = wall.height * 2
        wall.width = wall.width * 2
        wall.zIndex = 1
        
        if (this.world) {
            this.world.addChild(wall)
        }
        
        this.walls.push(wall)
        return wall
    }
    
    /**
     * Обновляет стены
     */
    updateWall() {
        this.walls.forEach((wall, idx) => {
            const wallX = wall.x || (wall.position ? wall.position.x : 0)
            if (wallX + 100 < this.zeroLeft) {
                if (this.world) {
                    this.world.removeChild(wall)
                }
                this.walls.splice(idx, 1)
            }
        })
    }
    
    /**
     * Обнаруживает стену для укрытия игрока
     * @returns {PIXI.Sprite|null} найденная стена или null
     */
    detectWall() {
        if (!this.player) return null
        
        const p = this.player.getBounds ? this.player.getBounds() : this.player
        
        return this.walls.find(w => {
            const wall = w.getBounds ? w.getBounds() : w
            const wallX = wall.x || (wall.position ? wall.position.x : 0)
            const wallWidth = wall.width || 0
            
            if (p.x > (wallX - wallWidth / 2) + w.bound &&
                p.x < (wallX - wallWidth / 2) + 40 + w.bound) {
                return w
            }
            return false
        }) || null
    }
    
    /**
     * Получает массив стен
     */
    getWalls() {
        return this.walls
    }
    
    /**
     * Очищает все стены
     */
    clear() {
        this.walls.forEach(wall => {
            if (this.world) {
                this.world.removeChild(wall)
            }
        })
        this.walls = []
    }
}
