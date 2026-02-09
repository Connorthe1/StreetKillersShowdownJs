import {random} from "../../utils/GameUtils";
import * as PIXI from "pixi.js";
import {soundPlayer} from "../../playSound";

export class Puddle {
    constructor(world, timer, resources, eventBus) {
        this.world = world
        this.timer = timer
        this.resources = resources
        this.eventBus = eventBus

        this.isAlive = true
        this.sprite = undefined
        this.toDestroy = false
        this.collisionOffset = {left: -20, right: 0}
    }

    create(worldCoords) {
        const rand = random(1, 2)
        const puddle = new PIXI.Sprite(this.resources.puddleTexture.textures[`puddle${rand}`])
        puddle.anchor.set(0.5)
        puddle.position.set(worldCoords.zeroRight + puddle.width, worldCoords.firstFloor + 24)

        this.sprite = puddle

        this.addToWorld()
        return this
    }

    activate(player) {
        if (!this.isAlive) return

        this.isAlive = false
        soundPlayer.waterStep()

        if (player.isRollState()) {
            this.eventBus.emit('game:addScore', 1)
            this.eventBus.emit('game:addPoints', 20)

            player.handlePuddle()

            for (let i = 0; i <= 20; i++) {
                this.eventBus.emit('particle:default', { coords: { x: this.sprite.x, y: this.sprite.y - 10 }, type: 'drop' })
            }
        } else {
            for (let i = 0; i <= 14; i++) {
                this.eventBus.emit('particle:default', { coords: { x: this.sprite.x - 20, y: this.sprite.y - 10 }, type: 'drop' })
            }

            // Вторая волна частиц с задержкой
            this.timer.sleep(250).then(() => {
                soundPlayer.waterStep()
                for (let i = 0; i <= 14; i++) {
                    this.eventBus.emit('particle:default', { coords: { x: this.sprite.x + 10, y: this.sprite.y - 10 }, type: 'drop' })
                }
            })

        }
    }

    update() {
        if (this.toDestroy) return

        if (this.isOutOfBounds()) {
            this.destroy()
        }
    }

    isOutOfBounds() {
        const puddle = this.sprite.getBounds()

        return puddle.x + puddle.width < 0
    }

    destroy() {
        this.world.removeChild(this.sprite)
        this.toDestroy = true
    }

    addToWorld() {
        this.world.addChild(this.sprite)
    }
}