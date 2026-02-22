/**
 * Базовый класс стены/укрытия
 */
export class Wall {
    constructor(world, worldCoords, resources, eventBus) {
        this.world = world
        this.worldCoords = worldCoords
        this.resources = resources
        this.eventBus = eventBus

        this.sprite = undefined
        this.toDestroy = false
    }

    update() {
        if (this.toDestroy) return

        if (this.isOutOfBounds()) {
            this.destroy()
        }
    }

    isOutOfBounds() {
        const wallX = this.sprite.x ?? this.sprite.position?.x ?? 0
        return wallX + 100 < this.worldCoords.zeroLeft
    }

    destroy() {
        if (this.world && this.sprite) {
            this.world.removeChild(this.sprite)
        }
        this.toDestroy = true
    }

    addToWorld() {
        if (this.world && this.sprite) {
            this.world.addChild(this.sprite)
        }
    }
}
