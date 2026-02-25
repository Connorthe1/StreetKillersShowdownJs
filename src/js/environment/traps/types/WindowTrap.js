import { Trap } from '../Trap'
import * as PIXI from 'pixi.js'
import {soundPlayer} from "../../../playSound";

export class WindowTrap extends Trap {
    constructor(world, resources, eventBus) {
        super(world, resources, eventBus)

        this.collisionOffset = {left: 10, right: 20}
    }

    /**
     * Создаёт спрайт окна и возвращает this для цепочки вызовов.
     * @param {number} x - позиция по X
     * @param {number} groundY - Y координата земли
     * @returns {WindowTrap}
     */
    create(x, groundY) {
        this.sprite = new PIXI.AnimatedSprite(this.resources.windowTexture.animations.window)
        this.sprite.loop = false
        this.sprite.animationSpeed = 0.6
        this.sprite.anchor.set(0.5)
        this.sprite.position.set(x, groundY - 137)
        this.sprite.zIndex = 1
        this.sprite.name = 'windowTrap'

        super.addToWorld()
        return this
    }

    activate() {
        if (!this.isAlive) return

        this.isAlive = false

        super.activate()
        soundPlayer.glassBreak()
        this.sprite.play()
    }
}
