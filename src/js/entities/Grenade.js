/**
 * Grenade.js
 *
 * Класс-инстанс одной гранаты (по аналогии с Bullet).
 * Хранит sprite, body Matter.js, lifeTime, обновляет позицию из физики и таймер.
 */

import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'

const DEFAULT_LIFE_TIME = 90

export class Grenade {
    constructor(world, resources, physicsManager, eventBus, timer) {
        this.world = world
        this.resources = resources
        this.physicsManager = physicsManager
        this.eventBus = eventBus
        this.timer = timer

        this.sprite = null
        this.body = null
        this.lifeTime = DEFAULT_LIFE_TIME
        this.toDestroy = false
        this.isAlive = true

        this.collisionOffset = {left: 30, right: 10}
    }

    /**
     * Создаёт спрайт гранаты, физическое тело и добавляет в мир.
     * @param {number} x
     * @param {number} y
     * @returns {this}
     */
    create(x, y) {
        const grenade = new PIXI.Sprite(this.resources.bounceParticlesTexture.textures.grenade)
        grenade.scale.set(-1.5)
        grenade.position.set(x, y)
        grenade.type = 'grenade'

        this.body = Matter.Bodies.rectangle(x, y, 12, 4, {
            isStatic: false,
            restitution: 0.5
        })

        const randomMassX = Math.random() * (0.2 - 0.1) + 0.1
        this.physicsManager.applyForce(this.body, this.body.position, {
            x: -randomMassX / 100,
            y: -0.0005
        })

        this.sprite = grenade
        this.lifeTime = DEFAULT_LIFE_TIME

        this.addToWorld()

        return this
    }

    update() {
        if (!this.isAlive) return;

        this.lifeTime--
        if (this.lifeTime <= 0) {
            this.activate(false)
            return
        }

        this.sprite.position.x = this.body.position.x
        this.sprite.position.y = this.body.position.y
        this.sprite.rotation = this.body.angle
    }

    async activate(now) {
        this.isAlive = false

        if (!now) {
            const warning = new PIXI.Sprite(this.resources.particles.textures.detection)
            warning.zIndex = 20
            warning.anchor.set(0.5)
            warning.tint = 16776960
            warning.scale.x = 1.5
            warning.scale.y = 2
            warning.position.set(this.sprite.x, this.sprite.y - 40)
            this.world.addChild(warning)
            await this.timer.sleep(300)
            warning.tint = 16711680
            await this.timer.sleep(200)

            this.world.removeChild(warning)
        }

        this.eventBus.emit('explode:create', {target: this.sprite, offsetX: 0, offsetY: 0, isBig: false})
        this.destroy()
    }

    addToWorld() {
        this.world.addChild(this.sprite)
        this.physicsManager.addBody(this.body)
    }

    destroy() {
        this.world.removeChild(this.sprite)
        this.physicsManager.removeBody(this.body)
        this.toDestroy = true
    }
}
