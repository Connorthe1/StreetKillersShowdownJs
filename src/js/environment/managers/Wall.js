/**
 * Wall.js
 * 
 * Менеджер стен и укрытий
 */

import * as PIXI from 'pixi.js'
import { random } from '../../utils/GameUtils.js'
export class WallManager {
    constructor(world, ground, worldCoords, resources, eventBus) {
        this.world = world
        this.ground = ground
        this.worldCoords = worldCoords
        this.resources = resources
        this.eventBus = eventBus

        // Массив стен
        this.walls = []

        eventBus.on('wall:bossClear', pos => {
            this.bossClear(pos)
        })

        eventBus.on('wall:create', data => {
            this.createWall(data.pos, data.forBoss, data.afterBuilding)
        })

        eventBus.on('wall:createInClub', data => {
            this.createCoverInClub(data.pos, data.type, data.forBoss)
        })
    }

    createWall(pos = null, forBoss = false, afterBuilding = 0) {
        const randomPos = pos || this.worldCoords.zeroRight + random(100, 250)

        if (!pos && !forBoss) {
            const rand = random(1, 10)
            if (rand > 1) {
                this.eventBus.emit('enemy:create', {pos: randomPos + 60, canCover: true})
            }
        }
        
        // Проверка на здания
        if (afterBuilding > randomPos - 100) {
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
            wall = new PIXI.Sprite(this.resources.textures.textures.coverTrash)
            wall.position.set(randomPos, groundY + 36)
            wall.bound = -20
            wall.coverX = randomPos - 28
        } else {
            // Обычная стена
            wall = new PIXI.Sprite(this.resources.textures.textures.wall)
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
        if (Math.random() < 0.5 && randomWall < 4) {
            const pos = random(10, wall.width / 2)
            this.eventBus.emit('garbage:create', {x: wall.x - wall.width / 2 + pos, y: wall.y, type: 4})
        }
        
        this.walls.push(wall)
        return wall
    }
    
    /**
     * Создает укрытие в здании
     * @deprecated Используйте BuildingManager.createCoverInBuild() вместо этого
     * Метод оставлен для обратной совместимости, но будет удален в будущем
     * @param {number} pos - позиция X
     * @param {boolean} isSecondFloor - на втором этаже
     * @param {boolean} isRoof - на крыше
     */
    createCoverInBuild(pos, isSecondFloor, isRoof) {
        let wall
        const groundY = this.ground.getLocalBounds ? this.ground.getLocalBounds().y : 0
        
        if (isRoof) {
            const randomWall = Math.floor(Math.random() * (1 + 1))
            wall = new PIXI.Sprite(this.resources.inFloorTexture.textures[`Floor-${randomWall}`])
            wall.coverX = pos - 34
        } else {
            const randomWall = Math.floor(Math.random() * (2 + 1))
            wall = new PIXI.Sprite(this.resources.inBuildTexture.textures[`inhouse-${randomWall}`])
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

    createCoverInClub(pos, type, forBoss) {
        const wall = new PIXI.Sprite(this.resources.inClubTexture.textures[`inClub-${type}`])
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
    }

    /**
     * Обновляет стены
     */
    update() {
        this.walls.forEach((wall, idx) => {
            const wallX = wall.x || (wall.position ? wall.position.x : 0)
            if (wallX + 100 < this.worldCoords.zeroLeft) {
                if (this.world) {
                    this.world.removeChild(wall)
                }
                this.walls.splice(idx, 1)
            }
        })
    }
    
    bossClear(pos) {
        this.walls.forEach((wall, idx) => {
            if (wall.x > pos - 400 && wall.x < pos + 200) {
                if (this.world) {
                    this.world.removeChild(wall)
                }
                this.walls.splice(idx, 1)
            }
        })
    }

    clear() {
        this.walls.forEach(wall => {
            if (this.world) {
                this.world.removeChild(wall)
            }
        })
        this.walls = []
    }
}
