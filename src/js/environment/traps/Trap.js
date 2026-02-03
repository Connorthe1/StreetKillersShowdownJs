export class Trap {
    constructor(world, resources, eventBus) {
        this.world = world
        this.resources = resources
        this.eventBus = eventBus

        this.isAlive = true
        this.collisionOffset = null
        this.sprite = undefined
        this.toDestroy = false
    }

    activate() {
        this.eventBus.emit('game:addPoints', 25)
    }

    update() {
        if (this.toDestroy) return

        if (this.isOutOfBounds()) {
            this.destroy()
        }
    }

    isOutOfBounds() {
        const trap = this.sprite.getBounds()

        return trap.x + trap.width < 0
    }

    destroy() {
        this.world.removeChild(this.sprite)
        this.toDestroy = true
    }

    addToWorld() {
        this.world.addChild(this.sprite)
    }

}