import {Puddle} from "./Puddle";

/**
 * Менеджер луж
 */
export class PuddleManager {
    constructor(world, worldCoords, resources, eventBus, sleep) {
        this.world = world
        this.worldCoords = worldCoords
        this.resources = resources
        this.eventBus = eventBus
        this.sleep = sleep

        // Массив луж
        this.puddles = []

        eventBus.on('puddle:create', data => {
            this.create(data.buildings)
        })
    }
    
    /**
     * Создает лужу
     */
    create(buildings) {
        // Проверка на здания (не создавать лужи на втором этаже или в клубе)
        if (buildings && buildings.length > 0) {
            const activeBuilding = buildings[0]
            const lastBuilding = buildings[buildings.length - 1]
            const lastBuildingBounds = lastBuilding.getLocalBounds ? lastBuilding.getLocalBounds() : lastBuilding
            
            if ((lastBuildingBounds.x + lastBuildingBounds.width > this.worldCoords.zeroRight &&
                 activeBuilding.getLocalBounds().x < this.worldCoords.zeroRight) &&
                (activeBuilding.secondFloor || activeBuilding.club)) {
                return null
            }
        }
        
        this.puddles.push(new Puddle(this.world, this.sleep, this.resources, this.eventBus).create(this.worldCoords))
    }

    /**
     * Обновляет лужи
     */
    update() {
        this.puddles.forEach(trap => trap.update())

        this.puddles = this.puddles.filter(trap => trap.toDestroy === false)
    }
    
    /**
     * Очищает все лужи
     */
    clear() {
        this.puddles.forEach(puddle => {
            puddle.destroy()
        })
        this.puddles = []
    }
}
