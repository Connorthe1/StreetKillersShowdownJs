import * as Matter from 'matter-js'

/**
 * Класс для управления физическим движком
 */
export class PhysicsManager {
    constructor() {
        this.engine = null
    }

    init(timeScale = 1) {
        this.engine = Matter.Engine.create()
        this.engine.timing.timeScale = timeScale
        return this.engine
    }

    update() {
        if (this.engine) {
            Matter.Engine.update(this.engine)
        }
    }

    createRectangleBody(x, y, width, height, options = {}) {
        return Matter.Bodies.rectangle(x, y, width, height, options)
    }

    createStaticBody(x, y, width, height) {
        return this.createRectangleBody(x, y, width, height, { isStatic: true })
    }

    createDynamicBody(x, y, width, height, options = {}) {
        return this.createRectangleBody(x, y, width, height, {
            isStatic: false,
            ...options
        })
    }

    addBody(body) {
        if (this.engine && body) {
            Matter.World.add(this.engine.world, body)
        }
    }

    removeBody(body) {
        if (this.engine && body) {
            Matter.World.remove(this.engine.world, body)
        }
    }

    applyForce(body, position, force) {
        if (body) {
            Matter.Body.applyForce(body, position, force)
        }
    }

    getEngine() {
        return this.engine
    }

    getWorld() {
        return this.engine ? this.engine.world : null
    }

    setTimeScale(timeScale) {
        if (this.engine) {
            this.engine.timing.timeScale = timeScale
        }
    }

    destroy() {
        if (this.engine) {
            Matter.Engine.clear(this.engine)
            this.engine = null
        }
    }
}
