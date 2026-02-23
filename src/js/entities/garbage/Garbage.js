import * as PIXI from 'pixi.js'
import { random } from '../../utils/GameUtils.js'
import { soundPlayer } from "../../playSound";

export class Garbage {
    constructor(world, resources, eventBus) {
        this.world = world;
        this.resources = resources
        this.eventBus = eventBus

        this.sprite = null
        this.isAlive = false

        this.toDestroy = false
    }

    create(posX, posY, type = 0) {
        const rand = type || random(1, 10)
        const garbage = new PIXI.Sprite(this.resources.garbageTexture.textures[`trash${rand}`])
        garbage.type = rand
        garbage.anchor.set(0, 1)
        garbage.position.set(posX, posY)

        this.isAlive = rand === 4 || rand === 3

        this.sprite = garbage

        this.addToWorld()

        return this
    }

    update() {
        if (this.toDestroy) return

        if (this.isOutOfBounds()) {
            this.destroy()
        }
    }

    activate() {
        if (!this.isAlive) return

        this.isAlive = false
        // Звук разбития стекла
        soundPlayer.glassBreak()
        
        // Создание частиц
        for (let i = 0; i <= 8; i++) {
            this.eventBus.emit('particle:default', {coords: this.sprite, type: 'bottle'})
        }

        this.destroy()
    }

    isOutOfBounds() {
        const garbage = this.sprite.getBounds()

        return garbage.x + garbage.width < 0
    }

    addToWorld() {
        this.world.addChild(this.sprite)
    }

    destroy() {
        this.world.removeChild(this.sprite)
        this.toDestroy = true
    }
}
