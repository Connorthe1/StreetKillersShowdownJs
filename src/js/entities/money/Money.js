import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import { random } from '../../utils/GameUtils.js'
import { soundPlayer } from '../../playSound.js'

/**
 * Одна монета (дроп)
 */
export class Money {
    constructor(world, physicsManager, resources, eventBus) {
        this.world = world
        this.physicsManager = physicsManager
        this.resources = resources
        this.eventBus = eventBus

        this.sprite = null
        this.body = null
        this.toDestroy = false

        this.collisionOffset = {left: -10, right: 10}
    }

    create(pos) {
        const money = new PIXI.Sprite(this.resources.menuIcons.textures.money)
        money.scale.set(0.15)
        money.anchor.set(0.5)
        money.position.set(pos.x, pos.y)

        const body = Matter.Bodies.rectangle(
            money.x,
            money.y,
            2,
            10,
            {
                isStatic: false,
                restitution: 0.5
            }
        )

        money.rotation = Math.floor(Math.random() * (6 + 1))

        this.sprite = money
        this.body = body
        this.addToWorld()

        let randomMassX = Math.random() * this.body.mass
        const randomMassY = Math.random() * this.body.mass
        randomMassX *= Math.round(Math.random()) ? 1 : -1

        this.physicsManager.applyForce(
            this.body,
            this.body.position,
            { x: randomMassX / 50, y: -randomMassY / 35 }
        )

        return this
    }

    update() {
        this.sprite.position = this.body.position

        if (this.body.speed > 0.2) {
            this.sprite.rotation += 0.1
        } else {
            this.sprite.rotation = this.body.angle
        }

        if (this.isOutOfBounds()) {
            this.destroy()
        }
    }

    activate() {
        soundPlayer.coins()
        this.eventBus.emit('game:addMoney', random(1, 10))
        this.destroy()
    }

    isOutOfBounds() {
        const bounds = this.sprite.getBounds()
        return bounds.x + bounds.width < 0
    }

    addToWorld() {
        this.world.addChild(this.sprite)
        this.physicsManager.addBody(this.body)
    }

    destroy() {
        this.physicsManager.removeBody(this.body)
        this.world.removeChild(this.sprite)
        this.toDestroy = true
    }
}
