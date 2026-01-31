import { FloorSegment } from "../classes/Floor";
import { WoodBG } from "../classes/WoodBG";
import { random } from '../../utils/GameUtils.js';
import { GROUND_COLORS, FENCE_CHANCE } from '../../core/GameConfig.js';
import {CarBG} from "../classes/CarBG";

/**
 * Менеджер земли/пола (новая версия)
 */
export class GroundManager {
    constructor(world, ground, woodsBG, physicsManager, resources, worldCoords, eventBus) {
        this.world = world
        this.ground = ground
        this.woodsBG = woodsBG
        this.physicsManager = physicsManager
        this.resources = resources
        this.worldCoords = worldCoords
        this.eventBus = eventBus

        // Состояние пола
        this.floorPosition = 0
        this.selectGroundColor = 0
        this.isFence = false
        
        // Массив деревянных элементов
        this.woodsBGarr = []
        this.currentCar = null

        this.refreshGroundColor()

        for (let i = 0; i <= 3; i++) {
            this.createFloor(i)
        }
    }

    createFloor(idx, isBuilding = false) {
        const changeWall = random(1, 10) < FENCE_CHANCE

        const floorSegment = new FloorSegment(
            { ...this.resources, WORLD_HEIGHT: this.worldCoords.worldHeight },
            this.physicsManager,
            this.floorPosition,
            idx,
            this.selectGroundColor,
            this.isFence,
            changeWall
        )

        this.isFence = changeWall

        this.ground.addChild(floorSegment.getPart())
        this.physicsManager.addBody(floorSegment.getBody())

        // Создание деревянных элементов
        if (Math.random() > 0.5) {
            this.createWood(floorSegment.getFloor().x, floorSegment.getFloor().y - floorSegment.getFloor().height)
        }

        // Создание мусора рядом с полом (если в здании)
        if (Math.random() > 0.75 && !isBuilding) {
            const posX = random(10, 100)
            const posY = random(35, 45)
            this.eventBus.emit('garbage:create', {x: floorSegment.getFloor().x + floorSegment.getFloor().width + posX, y: floorSegment.getFloor().y - floorSegment.getFloor().height + posY})
        }

        if (Math.random() > 0.75 && !isBuilding) {
            const posX = random(10, 100)
            const posY = random(5, 15)
            this.eventBus.emit('garbage:create', {x: floorSegment.getFloor().x + floorSegment.getFloor().width + posX, y: floorSegment.getFloor().y - floorSegment.getFloor().height + posY})
        }

        if (Math.random() > 0.5) {
            if (!this.currentCar) {
                this.currentCar = new CarBG(this.resources, this.worldCoords, floorSegment.getFloor().y - floorSegment.getFloor().height)
                this.world.addChild(this.currentCar.body)
            }
        }
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
            this.eventBus.emit('spawn:entity')
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

        if (this.currentCar) {
            const carBounds = this.currentCar.body.getBounds ? this.currentCar.body.getBounds() : this.currentCar.body
            this.currentCar.update()

            if (this.currentCar.side > 0) {
                // Движение справа налево
                if (carBounds.x + carBounds.width < 0) {
                    this.world.removeChild(this.currentCar.body)
                    this.currentCar = null
                }
            } else {
                // Движение слева направо
                if (carBounds.x > this.worldCoords.zeroRight) {
                    this.world.removeChild(this.currentCar.body)
                    this.currentCar = null
                }
            }
        }
    }
    
    /**
     * Создает деревянный элемент
     * @param {number} posX - позиция X
     * @param {number} posY - позиция Y
     */
    createWood(posX, posY) {
        const wood = new WoodBG(posX, posY, this.resources)
        
        this.woodsBGarr.push(wood.body)
        this.woodsBG.addChild(wood.body)
        
        return wood
    }
    
    /**
     * Устанавливает выбранный цвет земли
     */
    refreshGroundColor() {
        this.selectGroundColor = random(0, GROUND_COLORS.length - 1)
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
