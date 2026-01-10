/**
 * Ground.js
 * 
 * Менеджер земли/пола
 * 
 * Содержит:
 * - Создание пола (createFloor)
 * - Обновление пола (updateFloor)
 * - Создание деревянных элементов (createWood)
 * - Логика генерации бесконечного пола
 * - Управление физическими телами пола
 * - Управление заборами (fence)
 */

import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import { random } from '../utils/GameUtils.js'
import { FENCE_CHANCE, GROUND_COLORS } from '../core/GameConfig.js'

/**
 * Менеджер земли/пола
 */
export class GroundManager {
    constructor(world, ground, woodsBG, physicsManager, WORLD_WIDTH, WORLD_HEIGHT, resources, garbageManager) {
        this.world = world
        this.ground = ground
        this.woodsBG = woodsBG
        this.physicsManager = physicsManager
        this.WORLD_WIDTH = WORLD_WIDTH
        this.WORLD_HEIGHT = WORLD_HEIGHT
        this.resources = resources
        this.garbageManager = garbageManager

        // Состояние пола
        this.floorPosition = 0
        this.selectGroundColor = 0
        this.isFence = false
        this.fenceChance = FENCE_CHANCE
        this.groundColor = GROUND_COLORS
        
        // Массив деревянных элементов
        this.woodsBGarr = []
        
        // Callbacks
        this.spawnEntityCallback = null
    }
    
    /**
     * Устанавливает колбэки
     */
    setCallbacks(callbacks) {
        if (callbacks.spawnEntity) this.spawnEntityCallback = callbacks.spawnEntity
    }

    createFloor(idx, isBuilding = false) {
        const part = new PIXI.Container()
        const floor = new PIXI.Sprite(this.resources.textures.textures.ground)
        floor.anchor.set(0, 1)
        floor.position.set((this.floorPosition + idx) * floor.width, this.WORLD_HEIGHT)
        floor.tint = this.groundColor[this.selectGroundColor]
        
        // Создание фоновой стены/забора
        let bgWall
        const randomWall = Math.floor(Math.random() * (10 - 1 + 1) + 1)
        
        if (randomWall < this.fenceChance) {
            // Забор
            if (!this.isFence) {
                bgWall = new PIXI.Sprite(this.resources.textures.textures.groundFenceStart)
            } else {
                bgWall = new PIXI.Sprite(this.resources.textures.textures.groundFenceMiddle)
            }
            this.isFence = true
        } else {
            // Обычная стена
            if (this.isFence) {
                bgWall = new PIXI.Sprite(this.resources.textures.textures.groundFenceEnd)
            } else {
                bgWall = new PIXI.Sprite(this.resources.textures.textures.groundWall)
            }
            this.isFence = false
        }
        
        // Создание деревянных элементов
        if (Math.random() > 0.5) {
            this.createWood(floor.x, floor.y - floor.height)
        }

        // Создание мусора рядом с полом (если в здании)
        if (Math.random() > 0.75 && isBuilding) {
            const posX = random(10, 100)
            const posY = random(35, 45)
            this.garbageManager.createGarbage(floor.x + floor.width + posX, floor.y - floor.height + posY)
        }

        if (Math.random() > 0.75 && isBuilding) {
            const posX = random(10, 100)
            const posY = random(5, 15)
            this.garbageManager.createGarbage(floor.x + floor.width + posX, floor.y - floor.height + posY)
        }
        
        // Создание физического тела для пола
        floor.body = Matter.Bodies.rectangle(
            floor.x,
            floor.y - floor.height + 44,
            floor.width + 20,
            40,
            { isStatic: true }
        )
        
        bgWall.anchor.set(0, 1)
        bgWall.position.set((this.floorPosition + idx) * bgWall.width, floor.y - floor.height)
        
        part.addChild(floor)
        part.addChild(bgWall)

        this.ground.addChild(part)
        this.physicsManager.addBody(floor.body)
    }
    
    /**
     * Обновляет пол
     */
    updateFloor(zeroLeft, isBuilding) {
        if (!this.ground) return
        
        const groundBounds = this.ground.getLocalBounds()
        const groundX = groundBounds.x || 0
        
        // Создание нового сегмента пола при необходимости
        if (zeroLeft - groundX > 192) {
            this.floorPosition++
            
            // Удаление старого сегмента
            if (this.ground.children.length > 0) {
                const oldPart = this.ground.children[0]
                if (oldPart.children && oldPart.children.length > 0) {
                    const oldFloor = oldPart.children[0]
                    if (oldFloor.body && this.physicsManager) {
                        this.physicsManager.removeBody(oldFloor.body)
                    }
                }
                this.ground.removeChildAt(0)
            }
            
            // Создание нового сегмента
            this.createFloor(3, isBuilding)
            
            // Спавн сущностей
            if (this.spawnEntityCallback) {
                this.spawnEntityCallback()
            }
        }
        
        // Обновление деревянных элементов
        this.woodsBGarr.forEach((wood, idx) => {
            const w = wood.getBounds ? wood.getBounds() : wood
            const woodX = w.x || (wood.position ? wood.position.x : 0)
            const woodWidth = w.width || 0
            
            if (woodX + woodWidth < 0) {
                if (this.woodsBG) {
                    this.woodsBG.removeChild(wood)
                }
                this.woodsBGarr.splice(idx, 1)
            }
        })
    }
    
    /**
     * Создает деревянный элемент
     * @param {number} posX - позиция X
     * @param {number} posY - позиция Y
     */
    createWood(posX, posY) {
        const woodType = random(1, 4)
        const wood = new PIXI.AnimatedSprite(this.resources.woods.animations[`wood${woodType}_part`])
        wood.scale.set(random(0.8, 1.5, true, true))
        wood.anchor.set(0, 1)
        wood.position.set(posX, posY + 60)
        wood.animationSpeed = 0.1
        wood.play()
        
        this.woodsBGarr.push(wood)
        
        if (this.woodsBG) {
            this.woodsBG.addChild(wood)
        }
        
        return wood
    }
    
    /**
     * Устанавливает выбранный цвет земли
     */
    setSelectGroundColor(color) {
        this.selectGroundColor = color
    }
    
    /**
     * Очищает пол
     */
    clear() {
        // Очистка деревянных элементов
        this.woodsBGarr.forEach(wood => {
            if (this.woodsBG) {
                this.woodsBG.removeChild(wood)
            }
        })
        this.woodsBGarr = []
        
        // Очистка сегментов пола
        if (this.ground) {
            this.ground.children.forEach(part => {
                if (part.children && part.children.length > 0) {
                    const floor = part.children[0]
                    if (floor.body && this.physicsManager) {
                        this.physicsManager.removeBody(floor.body)
                    }
                }
            })
            this.ground.removeChildren()
        }
        
        this.floorPosition = 0
        this.isFence = false
    }
}
