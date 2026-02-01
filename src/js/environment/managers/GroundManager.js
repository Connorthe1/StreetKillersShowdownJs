import { FloorSegment } from "../classes/Floor";
import { random } from '../../utils/GameUtils.js';
import { GROUND_COLORS, FENCE_CHANCE } from '../../core/GameConfig.js';

/**
 * Менеджер земли/пола (новая версия)
 */
export class GroundManager {
    constructor(world, ground, physicsManager, resources, worldCoords, eventBus) {
        this.world = world
        this.ground = ground
        this.physicsManager = physicsManager
        this.resources = resources
        this.worldCoords = worldCoords
        this.eventBus = eventBus

        // Состояние пола
        this.floorPosition = 0
        this.selectGroundColor = 0
        this.isFence = false

        this.refreshGroundColor()

        for (let i = 0; i <= 3; i++) {
            this.createFloor(i)
        }
    }

    createFloor(idx) {
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
    }
    
    /**
     * Обновляет пол
     */
    updateFloor(zeroLeft) {
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
            this.createFloor(3)
            
            // Спавн сущностей
            this.eventBus.emit('spawn:entity')
        }
    }

    refreshGroundColor() {
        this.selectGroundColor = random(0, GROUND_COLORS.length - 1)
    }

    clear() {
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
