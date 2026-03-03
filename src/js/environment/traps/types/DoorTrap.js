import { Trap } from '../Trap'
import * as PIXI from 'pixi.js'

export class DoorTrap extends Trap {
    constructor(world, resources, eventBus) {
        super(world, resources, eventBus)

        this.collisionOffset = {left: 10, right: 20}
    }

    activate() {
        if (!this.isAlive) return

        this.isAlive = false

        super.activate()
        this.sprite.play()
    }

    /**
     * Создаёт спрайт двери и возвращает this для цепочки вызовов.
     * @param {number} x - позиция по X
     * @param {number} groundY - Y координата земли
     * @param {boolean} secondFloor - на втором этаже
     * @returns {DoorTrap}
     */
    create(x, groundY, secondFloor) {
        this.sprite = new PIXI.AnimatedSprite(this.resources.doorTexture.animations.door)
        this.sprite.loop = false
        this.sprite.animationSpeed = 0.6
        this.sprite.anchor.set(0.5)
        const y = secondFloor ? groundY - 143 : groundY + 47
        this.sprite.position.set(x, y)
        this.sprite.zIndex = 1
        this.sprite.name = 'doorTrap'

        super.addToWorld()
        return this
    }
}
